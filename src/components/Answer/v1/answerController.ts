import { Request, Response } from 'express';
import path from 'path';
import { Op } from 'sequelize';
import { customRequest } from '../../../environment';
import S3 from '../../../utils/aws';
import constants from '../../../utils/constants';
import { sequelize } from '../../../utils/dbConfig/dbConfig';
import helper from '../../../utils/helper';
import logger from '../../../utils/logger';
import voteModel from '../../Votes/model';
import answerModel from '../model';
import { answerInterface } from '../types/answerTyes';
import * as answerHelper from './answerHelper';

const answerAttributes = ['uuid', 'answer', 'is_accepted', 'answer_image', 'created_at', 'updated_at'];

export const list = async (req: Request, res: Response) => {
    try {
        let { page, recordsPerPage, sortOrder } = req.body;
        let { search } = req.body;

        sortOrder = helper.getDefaultSortOrder(sortOrder);
        const { orderBy, sortField, condition } = answerHelper.getOrderByfield(search, sortOrder);

        page = page ? page : 1;
        recordsPerPage = recordsPerPage ? recordsPerPage : 10;

        if (typeof page !== 'number' || typeof recordsPerPage !== 'number') {
            return helper.createResponse(res, res.__('PAGE'), null, constants.VALIDATION_SERVER_ERR);
        }

        let startPage = (page - 1) * recordsPerPage;

        const { count, rows } = await answerModel.getMany(startPage, recordsPerPage, condition, orderBy, answerAttributes);

        return helper.pagination(page, recordsPerPage, count, rows, sortField, orderBy, res);
    } catch (e) {
        logger.error(__filename, 'List', undefined, 'List ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const getAnswer = async (req: Request, res: Response) => {
    let questionUuid: string = req.params.uuid;
    try {
        const Data: any = await answerModel.getOne(
            {
                uuid: questionUuid,
            },
            answerAttributes
        );

        Data.dataValues.upVote = await voteModel.countVote({
            [Op.and]: [{ answer_id: Data.id }, { vote: true }],
        });
        Data.dataValues.downVote = await voteModel.countVote({
            [Op.and]: [{ answer_id: Data.id }, { vote: false }],
        });
        // console.log(Data);

        if (Data) {
            return helper.createResponse(res, res.__('QUESTION.List'), Data, constants.SUCCESS);
        } else {
            return helper.createResponse(res, res.__('NOT_FOUND'), undefined, constants.NOT_FOUND_ERR);
        }
    } catch (e: any) {
        logger.error(__filename, 'details', questionUuid, 'details ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const addAnswer = async (req: customRequest, res: Response) => {
    let transaction;
    try {
        let { user_id, question_id, answer, is_accepted } = req.body;
        let body: answerInterface = {
            user_id: user_id,
            question_id: question_id,
            answer: answer,
            is_accepted: is_accepted,
        };

        let answer_image = req.files.answer_image ? req.files.answer_image : null;

        if (answer_image !== null) {
            //     body.image = null;
            // } else {
            let imageExtension = path.extname(answer_image.name);
            let answer_imageName = 'img-' + Date.now() + imageExtension;

            let bufferFile = Buffer.from(answer_image.data, 'binary');

            await S3.uploadimageToS3(answer_imageName, bufferFile);

            body.answer_image = answer_imageName;
        }

        transaction = await sequelize.transaction();
        let addQuestion: any = await answerModel.addAns(body);
        await transaction.commit();

        return helper.createResponse(res, res.__('QUESTION.created'), addQuestion, constants.SUCCESS);
    } catch (e: any) {
        if (transaction) await transaction.rollback();
        logger.error(__filename, 'addAnswer', undefined, 'Error During add new Answer : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const updateAnswer = async (req: customRequest, res: Response) => {
    let answerUuid: string = req.params.uuid;
    try {
        let { user_id, question_id, answer, is_accepted } = req.body;
        let body: answerInterface = {
            user_id: user_id,
            question_id: question_id,
            answer: answer,
            is_accepted: is_accepted,
        };

        let imageFile: any = await answerModel.getOne({ uuid: answerUuid }, ['answer_image']);

        let answer_image = req.files.answer_image ? req.files.answer_image : imageFile.image;

        if (req.files.answer_image) {
            let imageExtension = path.extname(answer_image.name);
            let imageName = 'img-' + Date.now() + imageExtension;

            if (imageFile.answer_image) {
                let url = imageFile.answer_image;
                let imageName = url.substring(url.lastIndexOf('/') + 1);

                await S3.deleteimageToS3(imageName);
            }

            let bufferFile = Buffer.from(answer_image.data, 'binary');
            await S3.uploadimageToS3(imageName, bufferFile);

            body.answer_image = imageName;
        }

        await answerModel.updateAns(body, answerUuid);
        let data = await answerModel.getOne({ uuid: answerUuid });

        return helper.createResponse(res, res.__('QUESTION.updated'), data, constants.SUCCESS);
    } catch (e: any) {
        logger.error(__filename, 'updateAnswer', answerUuid, 'Error During update Answer : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const deleteAnswer = async (req: customRequest, res: Response) => {
    let answerUuid: string = req.params.uuid;
    try {
        let imageFile: any = await answerModel.getOne({ uuid: answerUuid }, ['image']);
        // console.log(image.profile_image);

        let removeUser = await answerModel.deleteAns(answerUuid);

        if (!removeUser) {
            return helper.createResponse(res, res.__('NOT_FOUND'), undefined, constants.NOT_FOUND_ERR);
        }

        if (imageFile.image) {
            // Delete in AWs-S3
            let url = imageFile.image;
            let imageName = url.substring(url.lastIndexOf('/') + 1);

            await S3.deleteimageToS3(imageName);
        }

        return helper.createResponse(res, res.__('QUESTION.deleted'), undefined, constants.SUCCESS);
    } catch (e) {
        console.log(e);
        logger.error(__filename, 'DeleteAnswer', answerUuid, 'Error During Delete Answer : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

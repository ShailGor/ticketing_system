import { Request, Response } from 'express';
import path from 'path';
import { Op } from 'sequelize';
import { customRequest } from '../../../environment';
import S3 from '../../../utils/aws';
import constants from '../../../utils/constants';
import { sequelize } from '../../../utils/dbConfig/dbConfig';
import helper from '../../../utils/helper';
import logger from '../../../utils/logger';
import userModel from '../../User/model';
import voteModel from '../../Votes/model';
import answerModel from '../model';
import { answerInterface } from '../types/answerTyes';
import * as answerHelper from './answerHelper';

const answerAttributes = ['id', 'uuid', 'answer', 'is_accepted', 'answer_image', 'created_at', 'updated_at'];

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

        const { count, rows }: any = await answerModel.getMany(startPage, recordsPerPage, condition, orderBy, answerAttributes);

        // for (let i = 0; i < rows.length; i++) {
        //     rows[i].dataValues.upVote = await voteModel.countVote({
        //         [Op.and]: [{ answer_id: rows[i].id }, { vote: true }],
        //     });
        //     rows[i].dataValues.downVote = await voteModel.countVote({
        //         [Op.and]: [{ answer_id: rows[i].id }, { vote: false }],
        //     });
        // }

        return helper.pagination(page, recordsPerPage, count, rows, sortField, orderBy, res);
    } catch (e) {
        logger.error(__filename, 'List', undefined, 'List ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const getAnswer = async (req: Request, res: Response) => {
    let answerUuid: string = req.params.uuid;
    try {
        const Data: any = await answerModel.getOne(
            {
                uuid: answerUuid,
            },
            answerAttributes
        );
        // console.log(Data.dataValues);
        console.log(Data.id);

        Data.dataValues.upVote = await voteModel.countVote({
            [Op.and]: [{ answer_id: Data.id }, { vote: true }],
        });
        Data.dataValues.downVote = await voteModel.countVote({
            [Op.and]: [{ answer_id: Data.id }, { vote: false }],
        });
        // console.log(Data);

        if (Data) {
            return helper.createResponse(res, res.__('ANSWER.List'), Data, constants.SUCCESS);
        } else {
            return helper.createResponse(res, res.__('NOT_FOUND'), undefined, constants.NOT_FOUND_ERR);
        }
    } catch (e: any) {
        logger.error(__filename, 'details', answerUuid, 'details ', e);
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
            // is_accepted: is_accepted,
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
        let addQuestion: any = await answerModel.addAns(body, transaction);
        await transaction.commit();

        return helper.createResponse(res, res.__('ANSWER.created'), addQuestion, constants.SUCCESS);
    } catch (e: any) {
        if (transaction) await transaction.rollback();
        logger.error(__filename, 'addAnswer', undefined, 'Error During add new Answer : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const updateAnswer = async (req: customRequest, res: Response) => {
    let transaction;
    let user_uuid: any = req.custom?.uuid;
    let answerUuid: string = req.params.uuid;
    try {
        // check user is moderator or not
        let User: any = await userModel.getOne({ uuid: user_uuid }, ['id', 'is_moderator']);
        let Answer_data: any = await answerModel.getOne({ uuid: answerUuid }, ['user_id']);
        console.log(user_uuid);

        if (Answer_data.user_id === User.id || User.is_moderator == 'true') {
            let { answer, is_accepted } = req.body;
            let body: answerInterface = {
                answer: answer,
                is_accepted: is_accepted,
            };

            let imageFile: any = await answerModel.getOne({ uuid: answerUuid }, ['answer_image']);

            let answer_image = req.files.answer_image ? req.files.answer_image : imageFile.answer_image;

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

            transaction = await sequelize.transaction();
            await answerModel.updateAns(body, answerUuid, transaction);
            await transaction.commit();

            let data = await answerModel.getOne({ uuid: answerUuid });

            return helper.createResponse(res, res.__('ANSWER.updated'), data, constants.SUCCESS);
        }

        return helper.createResponse(res, res.__('ANSWER.not_access'), undefined, constants.UNAUTHORIZED);
    } catch (e: any) {
        if (transaction) await transaction.rollback();
        logger.error(__filename, 'updateAnswer', answerUuid, 'Error During update Answer : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const deleteAnswer = async (req: customRequest, res: Response) => {
    let transaction;
    let user_uuid: any = req.custom?.uuid;
    let answerUuid: string = req.params.uuid;

    try {
        let User: any = await userModel.getOne({ uuid: user_uuid }, ['id', 'is_moderator']);
        let Answer_data: any = await answerModel.getOne({ uuid: answerUuid }, ['user_id']);

        if (Answer_data.user_id === User.id || User.is_moderator == 'true') {
            let imageFile: any = await answerModel.getOne({ uuid: answerUuid }, ['image']);
            // console.log(image.profile_image);
            if (imageFile.image) {
                // Delete in AWs-S3
                let url = imageFile.image;
                let imageName = url.substring(url.lastIndexOf('/') + 1);

                await S3.deleteimageToS3(imageName);
            }

            transaction = await sequelize.transaction();
            let removeUser = await answerModel.deleteAns(answerUuid, transaction);
            await transaction.commit();

            if (!removeUser) {
                return helper.createResponse(res, res.__('NOT_FOUND'), undefined, constants.NOT_FOUND_ERR);
            }

            return helper.createResponse(res, res.__('ANSWER.deleted'), undefined, constants.SUCCESS);
        }
        return helper.createResponse(res, res.__('ANSWER.not_access'), undefined, constants.UNAUTHORIZED);
    } catch (e) {
        console.log(e);
        if (transaction) await transaction.rollback();
        logger.error(__filename, 'DeleteAnswer', answerUuid, 'Error During Delete Answer : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

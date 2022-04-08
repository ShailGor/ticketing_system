import { Request, Response } from 'express';
import path from 'path';
import { customRequest } from '../../../environment';
import S3 from '../../../utils/aws';
import constants from '../../../utils/constants';
import { sequelize } from '../../../utils/dbConfig/dbConfig';
import helper from '../../../utils/helper';
import logger from '../../../utils/logger';
import questionModel from '../model';
import { associateInterface, questionInterface } from '../types/questionTypes';
import * as questionHelper from './questionHelper';

const questionAttributes = ['id', 'uuid', 'user_id', 'title', 'description', 'is_published', 'image', 'created_at', 'updated_at', 'deleted_at'];

export const list = async (req: Request, res: Response) => {
    try {
        let { page, recordsPerPage, sortOrder } = req.body;
        let { search } = req.body;

        sortOrder = helper.getDefaultSortOrder(sortOrder);
        const { orderBy, sortField, condition } = questionHelper.getOrderByfield(search, sortOrder);

        page = page ? page : 1;
        recordsPerPage = recordsPerPage ? recordsPerPage : 10;

        if (typeof page !== 'number' || typeof recordsPerPage !== 'number') {
            return helper.createResponse(res, res.__('PAGE'), null, constants.VALIDATION_SERVER_ERR);
        }

        let startPage = (page - 1) * recordsPerPage;

        const { count, rows } = await questionModel.getMany(startPage, recordsPerPage, condition, orderBy, questionAttributes);

        return helper.pagination(page, recordsPerPage, count, rows, sortField, orderBy, res);
    } catch (e) {
        logger.error(__filename, 'List', undefined, 'List ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const getQuestion = async (req: Request, res: Response) => {
    let questionUuid: string = req.params.uuid;
    try {
        const Data = await questionModel.getOne(
            {
                uuid: questionUuid,
            },
            questionAttributes
        );
        console.log(Data);

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

export const addQuestion = async (req: customRequest, res: Response) => {
    let transaction;
    try {
        let { user_id, title, description, is_published, tags } = req.body;
        let body: associateInterface = {
            user_id: user_id,
            title: title,
            description: description,
            is_published: is_published,
            tags: tags,
        };

        let tags_array: any = JSON.parse(body.tags!);
        // console.log(tags_array);
        body.questionTags = tags_array.map((t_id: number) => {
            return { tag_id: t_id };
        });
        console.log(body.questionTags);

        let image = req.files.image ? req.files.image : null;

        if (image !== null) {
            let imageExtension = path.extname(image.name);
            let imageName = 'img-' + Date.now() + imageExtension;

            let bufferFile = Buffer.from(image.data, 'binary');

            await S3.uploadimageToS3(imageName, bufferFile);

            body.image = imageName;
        }
        console.log(body);

        transaction = await sequelize.transaction();
        let addQuestion: any = await questionModel.addQuestion(body);
        await transaction.commit();

        console.log(addQuestion);

        return helper.createResponse(res, res.__('QUESTION.created'), addQuestion, constants.SUCCESS);
    } catch (e: any) {
        if (transaction) await transaction.rollback();
        logger.error(__filename, 'addQuestion', undefined, 'Error During add new question : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const updateQuestion = async (req: customRequest, res: Response) => {
    let questionUuid: string = req.params.uuid;
    try {
        let { user_id, title, description, is_published } = req.body;
        let body: questionInterface = {
            user_id: user_id,
            title: title,
            description: description,
            is_published: is_published,
        };

        let imageFile: any = await questionModel.getOne({ uuid: questionUuid }, ['image']);

        let image = req.files.image ? req.files.image : imageFile.image;

        if (req.files.image) {
            let imageExtension = path.extname(image.name);
            let imageName = 'img-' + Date.now() + imageExtension;

            if (imageFile.image) {
                let url = imageFile.image;
                let imageName = url.substring(url.lastIndexOf('/') + 1);

                await S3.deleteimageToS3(imageName);
            }

            let bufferFile = Buffer.from(image.data, 'binary');
            await S3.uploadimageToS3(imageName, bufferFile);

            body.image = imageName;
        }

        await questionModel.updateQuestion(body, questionUuid);
        let data = await questionModel.getOne({ uuid: questionUuid }, questionAttributes);

        return helper.createResponse(res, res.__('QUESTION.updated'), data, constants.SUCCESS);
    } catch (e: any) {
        logger.error(__filename, 'updatequestion', questionUuid, 'Error During update question : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const deleteQuestion = async (req: customRequest, res: Response) => {
    let questionUuid: string = req.params.uuid;
    try {
        let imageFile: any = await questionModel.getOne({ uuid: questionUuid }, ['image']);
        // console.log(image.profile_image);

        let removeUser = await questionModel.deleteQuestion(questionUuid);

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
        logger.error(__filename, 'DeleteQuestion', questionUuid, 'Error During Delete Question : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

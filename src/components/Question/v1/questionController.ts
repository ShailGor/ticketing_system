import { Request, Response } from 'express';
import path from 'path';
import { Op } from 'sequelize';
import { customRequest } from '../../../environment';
import S3 from '../../../utils/aws';
import constants from '../../../utils/constants';
import sequelize from '../../../utils/dbConfig';
import helper from '../../../utils/helper';
import logger from '../../../utils/logger';
import adminModel from '../../Admin/model';
import answerModel from '../../Answer/model';
import userModel from '../../User/model';
import voteModel from '../../Votes/model';
import questionModel from '../model';
import { associateInterface, questionInterface } from '../types/questionTypes';
import * as questionHelper from './questionHelper';

const questionAttributes = ['id', 'uuid', 'title', 'description', 'is_published', 'image', 'created_at', 'updated_at'];

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

        const { count, rows }: any = await questionModel.getMany(startPage, recordsPerPage, condition, orderBy, questionAttributes);

        // Total Votes given in the question(upVote and downVote)
        // for (let i = 0; i < rows.length; i++) {
        //     rows[i].dataValues.upVote = await voteModel.countVote({
        //         [Op.and]: [{ question_id: rows[i].id }, { vote: true }],
        //     });
        //     rows[i].dataValues.downVote = await voteModel.countVote({
        //         [Op.and]: [{ question_id: rows[i].id }, { vote: false }],
        //     });
        // }

        return helper.pagination(page, recordsPerPage, count, rows, sortField, orderBy, res);
    } catch (e) {
        logger.error(__filename, 'List', undefined, 'List ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const getQuestion = async (req: Request, res: Response) => {
    let questionUuid: string = req.params.uuid;
    try {
        const Data: any = await questionModel.getOne(
            {
                uuid: questionUuid,
            },
            questionAttributes
        );

        // Total Votes given in the question(upVote and downVote)
        Data.dataValues.upVote = await voteModel.countVote({
            [Op.and]: [{ question_id: Data.id }, { vote: true }],
        });
        Data.dataValues.downVote = await voteModel.countVote({
            [Op.and]: [{ question_id: Data.id }, { vote: false }],
        });
        // console.log(Data.dataValues);

        if (Data) {
            logger.info(__filename, 'details', questionUuid, 'details ', res.__('QUESTION.List'));
            return helper.createResponse(res, res.__('QUESTION.List'), Data, constants.SUCCESS);
        } else {
            return helper.createResponse(res, res.__('NOT_FOUND'), undefined, constants.NOT_FOUND_ERR);
        }
    } catch (e: any) {
        console.log(e);

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
        // console.log(body.questionTags);

        let image = req.files.image ? req.files.image : null;

        if (image !== null) {
            let imageExtension = path.extname(image.name);
            let imageName = 'img-' + Date.now() + imageExtension;

            let bufferFile = Buffer.from(image.data, 'binary');

            await S3.uploadimageToS3(imageName, bufferFile);

            body.image = imageName;
        }
        // console.log(body);

        transaction = await sequelize.transaction();
        let addQuestion: any = await questionModel.addQuestion(body);
        await transaction.commit();

        // console.log(addQuestion);

        return helper.createResponse(res, res.__('QUESTION.created'), addQuestion, constants.SUCCESS);
    } catch (e: any) {
        if (transaction) await transaction.rollback();
        logger.error(__filename, 'addQuestion', undefined, 'Error During add new question : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const updateQuestion = async (req: customRequest, res: Response) => {
    let transaction;
    let user_uuid: any = req.custom?.uuid;
    let admin: any = req.custom?.adminUuid;
    let questionUuid: string = req.params.uuid;

    try {
        // check user is moderator or not
        // let admin: any = await adminModel.getOne({ uuid: user_uuid });
        console.log(admin);
        let User: any;
        if (user_uuid) {
            User = await userModel.getOne({ uuid: user_uuid }, ['id', 'is_moderator']);
        }
        let Question_Data: any = await questionModel.getOne({ uuid: questionUuid }, ['user_id']);

        if (admin || Question_Data.user_id === User.id || User.is_moderator == 'true') {
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

            transaction = await sequelize.transaction();
            await questionModel.updateQuestion(body, questionUuid, transaction);
            await transaction.commit();

            let data = await questionModel.getOne({ uuid: questionUuid }, questionAttributes);

            return helper.createResponse(res, res.__('QUESTION.updated'), data, constants.SUCCESS);
        }
        return helper.createResponse(res, res.__('QUESTION.not_access'), undefined, constants.UNAUTHORIZED);
    } catch (e: any) {
        if (transaction) await transaction.rollback();
        logger.error(__filename, 'updatequestion', questionUuid, 'Error During update question : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const deleteQuestion = async (req: customRequest, res: Response) => {
    let transaction;
    let user_uuid: any = req.custom?.uuid;
    let admin: any = req.custom?.adminUuid;
    let questionUuid: string = req.params.uuid;

    try {
        // console.log(admin);
        // check user is moderator or not
        let User: any;
        if (user_uuid) {
            User = await userModel.getOne({ uuid: user_uuid }, ['id', 'is_moderator']);
        }
        let Question_Data: any = await questionModel.getOne({ uuid: questionUuid }, ['user_id']);

        if (Question_Data.user_id === User.id || User.is_moderator == 'true' || admin == true) {
            let imageFile: any = await questionModel.getOne({ uuid: questionUuid }, ['image']);
            // console.log(image.profile_image);

            if (imageFile.image) {
                // Delete in AWs-S3
                let url = imageFile.image;
                let imageName = url.substring(url.lastIndexOf('/') + 1);

                await S3.deleteimageToS3(imageName);
            }

            transaction = await sequelize.transaction();
            let removeUser = await questionModel.deleteQuestion(questionUuid, transaction);
            await transaction.commit();

            if (!removeUser) {
                return helper.createResponse(res, res.__('NOT_FOUND'), undefined, constants.NOT_FOUND_ERR);
            }

            return helper.createResponse(res, res.__('QUESTION.deleted'), undefined, constants.SUCCESS);
        }
        return helper.createResponse(res, res.__('QUESTION.not_access'), undefined, constants.UNAUTHORIZED);
    } catch (e) {
        console.log(e);
        if (transaction) await transaction.rollback();
        logger.error(__filename, 'DeleteQuestion', questionUuid, 'Error During Delete Question : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

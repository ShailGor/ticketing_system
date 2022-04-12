import { Request, Response } from 'express';
import { customRequest } from '../../../environment';
import constants from '../../../utils/constants';
import sequelize from '../../../utils/dbConfig';
import helper from '../../../utils/helper';
import logger from '../../../utils/logger';
import voteModel from '../model';

export const list = async (req: Request, res: Response) => {
    try {
        let dataList = await voteModel.getMany(['vote', 'created_at']);

        return helper.createResponse(res, res.__('VOTE.List'), dataList, constants.SUCCESS);
    } catch (e) {
        logger.error(__filename, 'List', undefined, 'List ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const getVote = async (req: Request, res: Response) => {
    let Uuid: string = req.params.uuid;
    try {
        const Data = await voteModel.getOne(
            {
                uuid: Uuid,
            },
            ['vote', 'created_at']
        );
        // console.log(Data);

        if (Data) {
            return helper.createResponse(res, res.__('VOTE.List'), Data, constants.SUCCESS);
        } else {
            return helper.createResponse(res, res.__('NOT_FOUND'), undefined, constants.NOT_FOUND_ERR);
        }
    } catch (e: any) {
        logger.error(__filename, 'details', Uuid, 'details ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const add = async (req: customRequest, res: Response) => {
    let transaction;
    try {
        let { user_id, question_id, answer_id, vote } = req.body;
        let body = {
            user_id: user_id,
            question_id: question_id,
            answer_id: answer_id,
            vote: vote,
        };

        transaction = await sequelize.transaction();
        let addQuestion: any = await voteModel.addVote(body);
        await transaction.commit();

        return helper.createResponse(res, res.__('VOTE.created'), addQuestion, constants.SUCCESS);
    } catch (e: any) {
        if (transaction) await transaction.rollback();
        logger.error(__filename, 'addAnswer', undefined, 'Error During add new Answer : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

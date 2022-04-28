import { Request, Response } from 'express';
import { customRequest } from '../../../environment';
import constants from '../../../utils/constants';
import sequelize from '../../../utils/dbConfig';
import helper from '../../../utils/helper';
import logger from '../../../utils/logger';
import answerModel from '../../Answer/model';
import questionModel from '../../Question/model';
import scoreModel from '../../Score/model';
import userModel from '../../User/model';
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

        let user: any;

        if (question_id) {
            user = await questionModel.getOne({ id: question_id }, ['user_id']); // find Question's user
            console.log('question User', user.user_id);
        } else if (answer_id) {
            user = await answerModel.getOne({ id: answer_id }, ['user_id']); // find Answer's user
            console.log('answer User', user.user_id);
        }

        if (vote == 'true') {
            // console.log(typeof vote);
            let addScore = await scoreModel.addScore({
                user_id: user.user_id,
                reputation: 5,
                criteria: 'upVote',
            });
            // console.log(addScore);
        } else if (vote == 'false') {
            let addScore = await scoreModel.addScore({
                user_id: user.user_id,
                reputation: -1,
                criteria: 'downVote',
            });
        }

        let totalScore = await scoreModel.totalScore({ user_id: user.user_id });
        console.log(totalScore);

        // TODO//
        if (totalScore >= 100) {
            await userModel.updateUser({ is_moderator: true }, { id: user.user_id });
        }

        transaction = await sequelize.transaction();
        let addVote: any = await voteModel.addVote(body);
        await transaction.commit();

        return helper.createResponse(res, res.__('VOTE.created'), addVote, constants.SUCCESS);
    } catch (e: any) {
        if (transaction) await transaction.rollback();
        logger.error(__filename, 'addAnswer', undefined, 'Error During add new Answer : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

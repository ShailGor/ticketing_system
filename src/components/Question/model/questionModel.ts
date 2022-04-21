import { Transaction } from 'sequelize';
import { User } from '../../User/schema';
import Question from '../schema';
import { questionTag } from '../schema/questionSchema';
import Tag from '../../Tags/schema';
import { associateInterface, questionInterface } from '../types/questionTypes';
import { Answer } from '../../Answer/schema/answerSchema';
import sequelize from 'sequelize';

export async function getMany(page: number, recordsPerPage: number, condition: any, order: any, attributes: string[] = [], other: object = {}) {
    let { count, rows } = await Question.findAndCountAll({
        where: condition,
        attributes: {
            include: [
                [sequelize.literal('(SELECT COUNT(vote) FROM votes where votes.question_id = Question.id  and vote = true)'), 'upVote'],
                [sequelize.literal('(SELECT COUNT(vote) FROM votes where votes.question_id = Question.id  and vote = false)'), 'downVote'],
            ],
            exclude: ['id', 'updated_at', 'deleted_at'],
        },
        distinct: true,
        include: [
            {
                model: Tag,
                as: 'tags',
                attributes: ['tag'],
                through: { attributes: [] },
            },
            {
                model: User,
                as: 'user',
                attributes: ['display_name', 'email'],
            },
            {
                model: Answer,
                attributes: ['answer', 'answer_image', 'user_id'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['display_name', 'email'],
                    },
                ],
            },
        ],
        order: order,
        offset: page,
        limit: recordsPerPage,
        ...other,
    });
    return { count, rows };
}

export async function getOne(condition: any = {}, attributes: string[] = [], other: object = {}): Promise<false | Question | null> {
    try {
        let Data = await Question.findOne({
            where: condition,
            attributes: attributes.length > 0 ? attributes : undefined,
            include: [
                {
                    model: Tag,
                    as: 'tags',
                    attributes: ['tag'],
                    through: { attributes: [] },
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['display_name', 'email'],
                },
                {
                    model: Answer,
                    attributes: ['answer', 'answer_image', 'user_id'],
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['display_name', 'email'],
                        },
                    ],
                },
            ],
            ...other,
        });
        return Data;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function addQuestion(data: any, transaction: Transaction | undefined = undefined): Promise<Question | boolean> {
    try {
        // console.log('data: ', data);

        let insertedObj: any = await Question.create(data, {
            include: {
                association: questionTag,
            },
            transaction: transaction ? transaction : undefined,
        });
        return insertedObj;
    } catch (e) {
        return false;
    }
}

export async function updateQuestion(
    data: questionInterface,
    Uuid: string,
    transaction: Transaction | undefined = undefined
): Promise<any | boolean> {
    try {
        let updateObj = await Question.update(data, {
            where: { uuid: Uuid },
            transaction: transaction ? transaction : undefined,
        });
        return updateObj;
    } catch (e) {
        return false;
    }
}

export async function deleteQuestion(Uuid: string, transaction: Transaction | undefined = undefined): Promise<any | boolean> {
    try {
        let deleteData = await Question.destroy({
            where: { uuid: Uuid },
            transaction: transaction ? transaction : undefined,
        });
        return deleteData;
    } catch (error) {
        return false;
    }
}

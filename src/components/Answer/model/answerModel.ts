import sequelize from 'sequelize';
import { Transaction } from 'sequelize';
import Question from '../../Question/schema';
import { User } from '../../User/schema';
import { Answer } from '../schema/answerSchema';
import { answerInterface } from '../types/answerTyes';

export async function getMany(page: number, recordsPerPage: number, condition: any, order: any, attributes: string[] = []) {
    const { count, rows } = await Answer.findAndCountAll({
        where: condition,
        attributes: {
            include: [
                [sequelize.literal('(SELECT COUNT(vote) FROM votes where votes.answer_id = Answer.id  and vote = true)'), 'upVote'],
                [sequelize.literal('(SELECT COUNT(vote) FROM votes where votes.answer_id = Answer.id  and vote = false)'), 'downVote'],
            ],
            exclude: ['deleted_at'],
        },
        distinct: true,
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['display_name', 'email'],
            },
            {
                model: Question,
                as: 'question',
                attributes: ['title', 'description', 'image'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['display_name', 'email', 'uuid'],
                    },
                ],
            },
        ],
        order: order,
        offset: page,
        limit: recordsPerPage,
    });
    return { count, rows };
}

export async function getAll(condition: any = {}, attributes: string[] = []): Promise<Answer[] | false> {
    try {
        return await Answer.findAll({
            where: condition,
            attributes: attributes,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['display_name', 'email'],
                },
            ],
        });
    } catch (e) {
        return false;
    }
}

export async function getOne(condition: any = {}, attributes: string[] = [], other: object = {}): Promise<false | Answer | null> {
    try {
        return await Answer.findOne({
            where: condition,
            attributes: attributes.length > 0 ? attributes : undefined,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['display_name', 'email'],
                },
                {
                    model: Question,
                    as: 'question',
                    attributes: ['title', 'description', 'image'],
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
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function addAns(data: any, transaction: Transaction | undefined = undefined): Promise<Answer | boolean> {
    try {
        const insertedObj: any = await Answer.create(data, {
            transaction: transaction ? transaction : undefined,
        });
        return insertedObj;
    } catch (e) {
        return false;
    }
}

export async function updateAns(data: any, condition: any = {}, transaction: Transaction | undefined = undefined): Promise<any | boolean> {
    try {
        const updateObj = await Answer.update(data, {
            where: condition,
            transaction: transaction ? transaction : undefined,
        });
        return updateObj;
    } catch (e) {
        return false;
    }
}

export async function deleteAns(Uuid: string, transaction: Transaction | undefined = undefined): Promise<any | boolean> {
    try {
        const deleteData = await Answer.destroy({
            where: { uuid: Uuid },
            transaction: transaction ? transaction : undefined,
        });
        return deleteData;
    } catch (error) {
        return false;
    }
}

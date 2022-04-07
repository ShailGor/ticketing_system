import { Transaction } from 'sequelize';
import Question from '../../Question/schema';
import { User } from '../../User/schema';
import { Answer } from '../schema/answerSchema';
import { answerInterface } from '../types/answerTyes';

export async function getMany(page: number, recordsPerPage: number, condition: any, order: any, attributes: string[] = []) {
    let { count, rows } = await Answer.findAndCountAll({
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
        order: order,
        offset: page,
        limit: recordsPerPage,
    });
    return { count, rows };
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
        let insertedObj: any = await Answer.create(data, {
            transaction: transaction ? transaction : undefined,
        });
        return insertedObj;
    } catch (e) {
        return false;
    }
}

export async function updateAns(data: answerInterface, bookUuid: string, transaction: Transaction | undefined = undefined): Promise<any | boolean> {
    try {
        let updateObj = await Answer.update(data, {
            where: { uuid: bookUuid },
            transaction: transaction ? transaction : undefined,
        });
        return updateObj;
    } catch (e) {
        return false;
    }
}

export async function deleteAns(bookUuid: string, transaction: Transaction | undefined = undefined): Promise<any | boolean> {
    try {
        let deleteData = await Answer.destroy({
            where: { uuid: bookUuid },
            transaction: transaction ? transaction : undefined,
        });
        return deleteData;
    } catch (error) {
        return false;
    }
}

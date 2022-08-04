import { Answer } from '../../Answer/schema/answerSchema';
import Question from '../../Question/schema';
import { User } from '../../User/schema';
import Tag from '../schema';

export async function getByTag(condition: any = {}, attributes: string[] = [], order: any, other: object = {}) {
    try {
        let { count, rows } = await Tag.findAndCountAll({
            where: condition,
            attributes: attributes,
            include: {
                model: Question,
                as: 'questions',
                where: { is_published: true },
                attributes: ['title', 'description', 'image'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['display_name', 'email'],
                    },
                    {
                        model: Answer,
                        attributes: ['answer', 'answer_image'],
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['display_name', 'email'],
                            },
                        ],
                    },
                ],
            },
            order: order,
            ...other,
        });
        return { count, rows };
    } catch (error) {
        return false;
    }
}

export async function getTag(condition: any = {}, attributes: string[] = [], other: object = {}) {
    try {
        let findObj = await Tag.findOne({
            where: condition,
            attributes: attributes.length > 0 ? attributes : undefined,
            ...other,
            logging: console.log,
        });
        return findObj;
    } catch (e) {
        throw e;
    }
}

export async function addTag(data: any) {
    try {
        let insertObj = await Tag.create(data);
        return insertObj;
    } catch (e) {
        return false;
    }
}

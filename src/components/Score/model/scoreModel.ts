import sequelize from 'sequelize';
import { Transaction } from 'sequelize';
import { User } from '../../User/schema';
import Score from '../schema';

export async function getAll(attributes: string[] = []): Promise<Score[] | false> {
    try {
        const data = await Score.findAll({
            include: {
                model: User,
                as: 'user',
                attributes: ['display_name', 'email'],
            },
            attributes: ['user_id', [sequelize.fn('sum', sequelize.col('reputation')), 'reputation']],
            group: ['user_id'],
        });
        return data;
    } catch (e) {
        return false;
    }
}

export async function countScore(condition: any = {}): Promise<number | false> {
    try {
        return await Score.count({
            where: condition,
        });
    } catch (e) {
        return false;
    }
}

export async function totalScore(condition: any = {}): Promise<number | false> {
    try {
        const score = await Score.sum('reputation', {
            where: condition,
        });
        return score;
    } catch (e) {
        return false;
    }
}

export async function addScore(data: any): Promise<Score | boolean> {
    try {
        const insertedObj = await Score.create(data);
        return insertedObj;
    } catch (e) {
        return false;
    }
}

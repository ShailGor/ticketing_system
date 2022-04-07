import { Op, Transaction } from 'sequelize';
import { User } from '../schema';
import { Skill } from '../schema/skillSchema';
import { userSkill } from '../schema/userSchema';
import { userInterface } from '../types/userTypes';

export async function getMany(page: number, recordsPerPage: number, condition: any, order: any, attributes: string[] = []) {
    let { count, rows } = await User.findAndCountAll({
        attributes: attributes.length > 0 ? attributes : undefined,
        where: condition,
        include: [
            {
                model: Skill,
                as: 'skills',
                attributes: ['skill'],
                through: { attributes: [] },
            },
        ],
        order: order,
        offset: page,
        limit: recordsPerPage,
    });
    return { count, rows };
}

export async function getOne(condition: any = {}, attributes: string[] = [], other: object = {}): Promise<false | User | null> {
    try {
        return await User.findOne({
            where: condition,
            attributes: attributes.length > 0 ? attributes : undefined,
            include: [
                {
                    model: Skill,
                    as: 'skills',
                    attributes: ['skill'],
                    through: { attributes: [] },
                },
            ],
            ...other,
        });
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function createUser(data: any): Promise<User | boolean> {
    try {
        let insertedObj: any = await User.create(data, {
            include: {
                association: userSkill,
            },
        });
        return insertedObj;
    } catch (e) {
        return false;
    }
}

export async function updateUser(data: userInterface, Uuid: string): Promise<any | boolean> {
    try {
        let updateObj = await User.update(data, {
            where: { uuid: Uuid },
        });
        return updateObj;
    } catch (e) {
        return false;
    }
}

export async function deleteUser(Uuid: string): Promise<any | boolean> {
    try {
        let deleteData = await User.destroy({
            where: { uuid: Uuid },
        });
        return deleteData;
    } catch (error) {
        return false;
    }
}

export async function updateWithCondition(data: any, condition: any) {
    try {
        let updateObj = await User.update(data, {
            where: condition,
        });
    } catch (e) {
        return false;
    }
}

export async function validateUser(email: string, display_name: string) {
    let message;
    let data: any = await User.findOne({
        attributes: ['email', 'display_name'],
        where: {
            [Op.or]: [{ email: email }, { display_name: display_name }],
        },
    });
    if (data) {
        if (data.email == email) {
            message = 'Email address alredy in use!';
        } else if (data.display_name == display_name) {
            message = 'Display_name alredy in use!';
        }
    }
    return message;
}

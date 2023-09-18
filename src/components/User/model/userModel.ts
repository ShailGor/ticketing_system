import sequelize, { Model } from 'sequelize';
import { Op, Transaction } from 'sequelize';
import { User } from '../schema';
import { Skill } from '../schema/skill/skillSchema';
import { userSkill } from '../schema/userSchema';
import { userInterface } from '../types/userTypes';

export async function getMany(
    page: number | undefined,
    recordsPerPage: number | undefined,
    condition: any = {},
    order: any,
    attributes: string[] = [],
    other: object = {}
) {
    try {
        const { count, rows }: any = await User.findAndCountAll({
            attributes: {
                include: [[sequelize.literal('(SELECT SUM(reputation) FROM scores where scores.user_id = User.id)'), 'reputations']],
                exclude: attributes,
            },
            where: condition,
            distinct: true,
            include: [
                {
                    model: Skill,
                    as: 'skills',
                    attributes: ['skill'],
                    through: { attributes: [] },
                },
            ],
            order: order,
            // order: [[sequelize.literal('xyz'), 'DESC']],
            offset: page,
            limit: recordsPerPage,
            ...other,
            logging: console.log,
        });
        // For show total reputation of every User
        // for (let i = 0; i < rows.length; i++) {
        //     rows[i].dataValues.reputation = await scoreModel.totalScore({ user_id: rows[i].id });
        // }
        // console.log(rows);

        return { count, rows };
    } catch (e) {
        return false;
    }
}

// export async function userList(dbQuery: string) {
//     try {
//         let Data: any = await sequelizeDb.;
//     } catch (e) {
//         return false;
//     }
// }

export async function getOne(condition: any = {}, attributes: string[] = [], other: object = {}): Promise<false | User | null> {
    try {
        const Data: any = await User.findOne({
            where: condition,
            attributes: {
                include: [[sequelize.literal('(SELECT SUM(reputation) FROM scores where scores.user_id = User.id)'), 'reputation']],
                exclude: ['created_at', 'updated_at', 'deleted_at'],
            },
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
        // For show total reputation of User
        // Data.dataValues.reputation = await scoreModel.totalScore({ user_id: Data.id });
        // console.log(Data);

        return Data;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function createUser(data: any): Promise<User | boolean> {
    try {
        console.log('userData: ', data);

        const insertedObj: any = await User.create(data, {
            include: {
                association: userSkill,
            },
        });
        return insertedObj;
    } catch (e) {
        return false;
    }
}

export async function updateUser(data: userInterface, condition: any = {}): Promise<any | boolean> {
    try {
        const updateObj = await User.update(data, {
            where: condition,
        });
        return updateObj;
    } catch (e) {
        return false;
    }
}

export async function deleteUser(Uuid: string): Promise<any | boolean> {
    try {
        const deleteData = await User.destroy({
            where: { uuid: Uuid },
        });
        return deleteData;
    } catch (error) {
        return false;
    }
}

export async function updateWithCondition(data: any, condition: any) {
    try {
        const updateObj = await User.update(data, {
            where: condition,
        });
    } catch (e) {
        return false;
    }
}

export async function validateUser(email: string, display_name: string) {
    let message;
    const data: any = await User.findOne({
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

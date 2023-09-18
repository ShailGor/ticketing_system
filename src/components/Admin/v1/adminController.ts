import { Response } from 'express';
import { customRequest } from '../../../environment';
import adminModel from '../model';
import bcrypt from 'bcrypt';
import fs from 'fs';
import ejs from 'ejs';
import { Parser } from 'json2csv';
import helper from '../../../utils/helper';
import { client } from '../../../utils/Redis';
import logger from '../../../utils/logger';
import constants from '../../../utils/constants';
import userModel from '../../User/model';
import * as questionHelper from '../../Question/v1/questionHelper';
import questionModel from '../../Question/model';
import sequelize, { Op } from 'sequelize';
import { createPDF } from './adminHelper';
import tagmodel from '../../Tags/model';
import Question from '../../Question/schema';
import { User } from '../../User/schema';
import { Answer } from '../../Answer/schema/answerSchema';

export const login = async function (req: customRequest, res: Response) {
    try {
        // throw new Error('custom error');
        const { email, password }: { email: string; password: string | Buffer } = req.body;

        const admin: any = await adminModel.getOne({ email: email }, ['uuid', 'password']);

        if (admin) {
            // console.log(user.password);

            const validatePwd = bcrypt.compareSync(password, admin.password);
            // console.log(validatePwd);
            if (validatePwd) {
                const jwtToken: any = await helper.jwtToken(admin.uuid);

                await client.hSet(admin.uuid, { jwt_token: jwtToken });
                await client.expire(admin.uuid, 2 * 60 * 60);

                logger.info(__filename, 'Admin Login', admin.uuid, res.__('LOGIN.success'), jwtToken);
                return helper.createResponse(res, res.__('LOGIN.success'), jwtToken, constants.SUCCESS);
            } else {
                return helper.createResponse(res, res.__('LOGIN.pwd-wrong'), undefined, constants.VALIDATION_SERVER_ERR);
            }
        }
        return helper.createResponse(res, res.__('LOGIN.user_not_found'), undefined, constants.NOT_FOUND_ERR);
    } catch (e: any) {
        // console.log(e);
        logger.error(__filename, 'Admin login', undefined, 'Error During login : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const logout = async function (req: customRequest, res: Response) {
    const token = req.headers.authorization;
    const uuid: any = req.custom?.adminUuid;
    try {
        // console.log(token);

        const verify_token = await client.hGet(uuid, 'jwt_token');

        console.log(verify_token);
        if (verify_token == token) {
            await client.del(uuid);
            logger.info(__filename, 'Admin logout', uuid, `Logout successfully..`, ``);
            return helper.createResponse(res, res.__('LOGOUT.logout'), undefined, constants.SUCCESS);
        }
        return helper.createResponse(res, res.__('LOGOUT.login'), undefined, constants.VALIDATION_SERVER_ERR);
    } catch (e: any) {
        console.log(e);
        logger.error(__filename, 'Admin logout', undefined, 'Error During login : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const resetPassword = async function (req: customRequest, res: Response) {
    const uuid: any = req.custom?.adminUuid;
    const { old_password, new_password }: { old_password: string; new_password: string } = req.body;
    try {
        console.log(new_password);

        const check: any = await adminModel.getOne({ uuid: uuid }, ['uuid', 'password']);
        if (check) {
            const validatePwd = bcrypt.compareSync(old_password, check.password);

            if (validatePwd) {
                await adminModel.updateadmin({ password: new_password }, { uuid: uuid });
                logger.info(__filename, req.method, check.uuid, res.__('ADMIN.Reset_pwd.success'), undefined);
                return helper.createResponse(res, res.__('ADMIN.Reset_pwd.success'), undefined, constants.SUCCESS);
            }
            return helper.createResponse(res, res.__('ADMIN.Reset_pwd.wrong'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        return helper.createResponse(res, res.__('ADMIN.Reset_pwd.incorrect'), undefined, constants.VALIDATION_SERVER_ERR);
    } catch (e: any) {
        console.log(e);
        logger.error(__filename, 'resendOtp', undefined, 'Error During resendOtp : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export async function userList(req: customRequest, res: Response) {
    const uuid: any = req.custom?.adminUuid;
    try {
        let { page, recordsPerPage, sortOrder, sortField } = req.body;
        const { search } = req.body;

        sortOrder = helper.getDefaultSortOrder(sortOrder);
        // const { orderBy, sortField, condition } = userHelper.getOrderByfield(search, sortOrder);
        // const orderBy = [[User, Score, sortField, sortOrder]];
        const orderBy = [[sequelize.literal('reputations'), 'DESC']];
        page = page ? page : 1;
        recordsPerPage = recordsPerPage ? recordsPerPage : 10;

        if (typeof page !== 'number' || typeof recordsPerPage !== 'number') {
            return helper.createResponse(res, res.__('PAGE'), null, constants.VALIDATION_SERVER_ERR);
        }

        const startPage = (page - 1) * recordsPerPage;

        const { count, rows }: any = await userModel.getMany(startPage, recordsPerPage, undefined, orderBy, ['password'], { paranoid: false });
        // console.log(rows);

        // show the reputation of all user
        // for (let i = 0; i < rows.length; i++) {
        //     let reputation = await scoreModel.totalScore({ user_id: rows[i].id });
        //     rows[i].dataValues.reputation = reputation ? reputation : 0;
        // }
        // console.log(await scoreModel.getAll(['reputation']));
        logger.info(__filename, 'question List', undefined, 'User data list', {});
        return helper.pagination(page, recordsPerPage, count, rows, sortField, sortOrder, res);
    } catch (e) {
        console.log(e);
        logger.error(__filename, 'User List', undefined, 'Error During fetching user list : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
}

export async function questionListByTags(req: customRequest, res: Response) {
    try {
        let { page, recordsPerPage, sortOrder } = req.body;
        const { search } = req.body;

        sortOrder = helper.getDefaultSortOrder(sortOrder);
        // const { orderBy, sortField, condition } = questionHelper.getOrderByfield(search, sortOrder);

        page = page ? page : 1;
        recordsPerPage = recordsPerPage ? recordsPerPage : 10;

        if (typeof page !== 'number' || typeof recordsPerPage !== 'number') {
            return helper.createResponse(res, res.__('PAGE'), null, constants.VALIDATION_SERVER_ERR);
        }

        const startPage = (page - 1) * recordsPerPage;

        const order = [['tag', sortOrder]];
        const condition: any = [];
        if (search) {
            const filter = search.filter;
            for (const key in filter) {
                const data: any = filter[key];
                condition.push({
                    [key]: { [Op.like]: `%${data}%` },
                });
            }
        }
        const other = {
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
            offset: startPage,
            limit: recordsPerPage,
        };
        const { count, rows }: any = await tagmodel.getByTag(condition, ['tag'], order, other);

        // Total Votes given in the question(upVote and downVote)
        // for (let i = 0; i < rows.length; i++) {
        //     rows[i].dataValues.Answers = await answerModel.getAll({ question_id: rows[i].id }, ['answer']); // All Answers for the question

        //     rows[i].dataValues.upVote = await voteModel.countVote({
        //         [Op.and]: [{ question_id: rows[i].id }, { vote: true }],
        //     });
        //     rows[i].dataValues.downVote = await voteModel.countVote({
        //         [Op.and]: [{ question_id: rows[i].id }, { vote: false }],
        //     });
        // }
        logger.info(__filename, 'question List', undefined, 'question data list', {});
        return helper.pagination(page, recordsPerPage, count, rows, 'tag', order, res);
    } catch (e) {
        console.log(e);
        logger.error(__filename, 'question List', undefined, 'Error During fetching question list : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
}

export async function addtag(req: customRequest, res: Response) {
    try {
        const { Tag } = req.body;

        const check = await tagmodel.getTag({ tag: Tag });
        console.log(check);

        if (!check) {
            const data = await tagmodel.addTag({ tag: Tag });
            logger.info(__filename, 'Add Tag', undefined, 'Add Tag data', {});
            return helper.createResponse(res, res.__('ADMIN.Tag.created'), data, constants.SUCCESS);
        }
        return helper.createResponse(res, res.__('ADMIN.Tag.already'), undefined, constants.VALIDATION_SERVER_ERR);
    } catch (e) {
        console.log(e);
        logger.error(__filename, 'Add Tag', undefined, 'Error During Add Tag in table : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
}

export async function userReport(req: customRequest, res: Response) {
    try {
        const type = req.body.type ? req.body.type : 'pdf';
        let filename, reportPath: fs.PathOrFileDescriptor;

        const orderBy = [[sequelize.literal('reputations'), 'DESC']];
        const { count, rows }: any = await userModel.getMany(undefined, undefined, undefined, orderBy, ['password'], { paranoid: false });
        const userDetails = rows;
        // console.log(userDetails[0].dataValues.reputations);

        userDetails.map(function (user: any) {
            // console.log(user.skills);
            user.reputation = user.dataValues.reputations;
            user.allSkills = user.skills
                .map(function (skilltemp: any) {
                    return skilltemp.dataValues.skill;
                })
                .toString();
        });

        if (userDetails) {
            if (type == 'csv') {
                filename = 'user' + Date.now() + '.csv';
                reportPath = '/home/shail/Desktop/Ticketing_System/Reports/' + filename;

                const fields = [
                    'id',
                    'uuid',
                    'first_name',
                    'last_name',
                    'display_name',
                    'email',
                    'phone_number',
                    'reputation',
                    'is_email_verified',
                    'is_moderator',
                    'profile_image',
                    'allSkills',
                    'created_at',
                    'updated_at',
                    'deleted_at',
                ];
                const opts = { fields };

                // try {
                const parser = new Parser(opts);
                const csv = parser.parse(userDetails);
                fs.writeFileSync(reportPath, csv);
                // } catch (err) {
                //     console.error(err);
                // }
                return helper.createResponse(res, res.__('ADMIN.Report.csv'), undefined, constants.SUCCESS);
            } else {
                const template = fs.readFileSync('/home/shail/Desktop/Ticketing_System/userReport.ejs', 'utf-8');
                const dataList = ejs.render(template, { userDetails: userDetails });

                // console.log(dataList);

                const options = {
                    height: '12in',
                    width: '30in',
                    header: {
                        height: '20mm',
                    },
                    footer: {
                        height: '20mm',
                    },
                };
                filename = 'user' + Date.now() + '.pdf';
                reportPath = '/home/shail/Desktop/Ticketing_System/Reports/' + filename;

                const pdf = await createPDF(dataList, options, reportPath);
                // return res.download(reportPath);
                return helper.createResponse(res, res.__('ADMIN.Report.pdf'), undefined, constants.SUCCESS);
            }
        }
    } catch (e) {
        console.log(e);
        logger.error(__filename, 'user report', undefined, 'Error during generate user Report', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
}

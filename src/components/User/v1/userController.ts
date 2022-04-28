import { Request, Response } from 'express';
import { associateInterface, userInterface } from '../types/userTypes';
import { v4 as uuid_v4 } from 'uuid';
import { customRequest } from '../../../environment';
import path from 'path';
import S3 from '../../../utils/aws';
import helper from '../../../utils/helper';
import constants from '../../../utils/constants';
import userModel from '../model';
import logger from '../../../utils/logger';
import { client } from '../../../utils/Redis';
import * as userHelper from './userHelper';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import scoreModel from '../../Score/model';

export const list = async (req: Request, res: Response) => {
    try {
        let { page, recordsPerPage, sortOrder } = req.body;
        let { search } = req.body;

        sortOrder = helper.getDefaultSortOrder(sortOrder);
        const { orderBy, sortField, condition } = userHelper.getOrderByfield(search, sortOrder);

        page = page ? page : 1;
        recordsPerPage = recordsPerPage ? recordsPerPage : 10;

        if (typeof page !== 'number' || typeof recordsPerPage !== 'number') {
            return helper.createResponse(res, res.__('PAGE'), null, constants.VALIDATION_SERVER_ERR);
        }

        let startPage = (page - 1) * recordsPerPage;

        // let data = await userModel.getAll();
        const excludeUserAttributes = ['id', 'password', 'updated_at', 'deleted_at'];

        const { count, rows }: any = await userModel.getMany(startPage, recordsPerPage, condition, orderBy, excludeUserAttributes);
        // console.log({ count, rows });

        return helper.pagination(page, recordsPerPage, count, rows, sortField, sortOrder, res);
    } catch (e) {
        logger.error(__filename, 'userList', undefined, 'userList ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const getUser = async (req: Request, res: Response) => {
    let userUuid: string = req.params.uuid;
    try {
        const userAttributes = ['id', 'uuid', 'first_name', 'last_name', 'display_name', 'email', 'is_moderator', 'phone_number', 'created_at'];
        const userData: any = await userModel.getOne(
            {
                uuid: userUuid,
            },
            userAttributes
        );
        console.log(userData);

        if (userData) {
            // show the reputation of one user
            // let reputation = await scoreModel.totalScore({ user_id: userData.id });
            // userData.dataValues.reputation = reputation ? reputation : 0;
            // console.log(userData);

            return helper.createResponse(res, res.__('USER.List'), userData, constants.SUCCESS);
        } else {
            return helper.createResponse(res, res.__('NOT_FOUND'), undefined, constants.NOT_FOUND_ERR);
        }
    } catch (e: any) {
        logger.error(__filename, 'details', userUuid, 'details ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const addUser = async (req: customRequest, res: Response) => {
    try {
        let { first_name, last_name, display_name, email, password, phone_number, skills } = req.body;
        let body: associateInterface = {
            first_name: first_name,
            last_name: last_name,
            display_name: display_name,
            email: email,
            password: password,
            phone_number: phone_number,
            skills: skills,
        };

        let verification_token = uuid_v4();

        let UniqueUser = await userModel.validateUser(email, display_name);
        if (UniqueUser) {
            return helper.createResponse(res, UniqueUser, undefined, constants.VALIDATION_SERVER_ERR);
        }

        let skills_array: any = JSON.parse(body.skills!);
        // console.log(skills_array);
        body.userSkills = skills_array.map((s_id: number) => {
            // return {a_id};
            return { skill_id: s_id };
        });
        console.log(body.userSkills);

        let profile_image = req.files.profile_image ? req.files.profile_image : null;

        if (profile_image !== null) {
            //     body.profile_image = null;
            // } else {
            let imageExtension = path.extname(profile_image.name);
            let profile_imageName = 'img-' + Date.now() + imageExtension;

            let bufferFile = Buffer.from(profile_image.data, 'binary');

            await S3.uploadimageToS3(profile_imageName, bufferFile);

            body.profile_image = profile_imageName;
        }

        let addUser: any = await userModel.createUser(body);

        await client.hSet(verification_token, { uuid: addUser.uuid });
        await client.expire(verification_token, 2 * 60);

        await userHelper.sendEmail(email, verification_token, undefined);

        return helper.createResponse(res, res.__('USER.created'), addUser, constants.SUCCESS);
    } catch (e: any) {
        console.log(e);
        logger.error(__filename, 'addProject', undefined, 'Error During add new project : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const userVerification = async function (req: customRequest, res: Response) {
    try {
        let emailToken = req.params.token;
        let uuid: any = await client.hGet(emailToken, 'uuid');

        console.log(uuid);
        if (uuid) {
            await client.del('verification_token');
            let userData = await userModel.updateWithCondition(
                {
                    is_email_verified: true,
                },
                {
                    uuid: uuid,
                }
            );
            console.log(userData);
            if (userData == false) {
                return helper.createResponse(res, res.__('USER.EmailVerification.alreadyVerify'), undefined, constants.SUCCESS);
            } else {
                return helper.createResponse(res, res.__('USER.EmailVerification.verified'), undefined, constants.SUCCESS);
            }
        } else {
            return helper.createResponse(res, res.__('USER.EmailVerification.expired'), undefined, constants.SUCCESS);
        }
    } catch (e: any) {
        console.log(e);
        logger.error(__filename, 'email_verification', '', 'Error During verify email : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const login = async function (req: customRequest, res: Response) {
    try {
        // throw new Error('custom error');
        let { email, password }: { email: userInterface; password: string | Buffer } = req.body;

        let user: any = await userModel.getOne({ email: email }, ['uuid', 'password', 'is_email_verified']);
        // console.log(user.is_email_verified);
        let token = await client.hGet(user.uuid, 'jwt_token');
        if (token) {
            return helper.createResponse(res, res.__('LOGIN.already'), undefined, constants.SUCCESS);
        }
        console.log(user.is_email_verified);

        if (user.is_email_verified == true) {
            if (user) {
                // console.log(user.password);

                let validatePwd = bcrypt.compareSync(password, user.password);
                // console.log(validatePwd);
                if (validatePwd) {
                    let jwtToken: any = await helper.jwtToken(user.uuid);

                    await client.hSet(user.uuid, { jwt_token: jwtToken });
                    await client.expire(user.uuid, 2 * 60 * 60);

                    logger.info(__filename, req.method, user.uuid, res.__('LOGIN.success'), jwtToken);
                    return helper.createResponse(res, res.__('LOGIN.success'), jwtToken, constants.SUCCESS);
                } else {
                    return helper.createResponse(res, res.__('LOGIN.pwd-wrong'), undefined, constants.VALIDATION_SERVER_ERR);
                }
            }
            return helper.createResponse(res, res.__('LOGIN.user_not_found'), undefined, constants.NOT_FOUND_ERR);
        }
        return helper.createResponse(res, res.__('LOGIN.verify'), undefined, constants.NOT_FOUND_ERR);
    } catch (e: any) {
        // console.log(e);
        logger.error(__filename, 'login', undefined, 'Error During login : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const logout = async function (req: customRequest, res: Response) {
    console.log('abc');

    let token = req.headers.authorization;
    let uuid: any = req.custom?.uuid;
    try {
        // console.log(token);

        let verify_token = await client.hGet(uuid, 'jwt_token');

        console.log(verify_token);
        if (verify_token == token) {
            await client.del(uuid);
            logger.info(__filename, 'logout', uuid, `Logout successfully..`, ``);
            return helper.createResponse(res, res.__('LOGOUT.logout'), undefined, constants.SUCCESS);
        }
        return helper.createResponse(res, res.__('LOGOUT.login'), undefined, constants.VALIDATION_SERVER_ERR);
    } catch (e: any) {
        console.log(e);
        logger.error(__filename, 'logout', undefined, 'Error During login : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const forgotPassword = async function (req: customRequest, res: Response) {
    try {
        let { name } = req.body;

        let user = await userModel.getOne(
            {
                [Op.or]: [{ email: name }, { display_name: name }],
            },
            ['uuid', 'email']
        );
        if (user) {
            let otp = userHelper.generateOtp();
            let sendEmail = await userHelper.sendEmail(user.email, undefined, otp);

            await client.hSet(user.uuid, { otp: otp });
            await client.expire(user.uuid, 2 * 60);

            // let update = await authorModel.updateAuthor({
            //     otp: otp,
            //     otp_expiry: otp_expiry
            // }, user.uuid);
            logger.info(__filename, req.method, user.uuid, i18n.__('USER.Forgot.otpSent'), undefined);
            return helper.createResponse(res, res.__('USER.Forgot.otpSent'), { uuid: user.uuid }, constants.SUCCESS);
        }
        return helper.createResponse(res, res.__('USER.Forgot.user_not_found'), undefined, constants.NOT_FOUND_ERR);
    } catch (e: any) {
        console.log(e);
        logger.error(__filename, 'forgotPassword', undefined, 'Error During forgotPassword : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const verifyOtp = async function (req: customRequest, res: Response) {
    let { uuid, otp }: userInterface = req.body;
    try {
        let checkUuid: any = await userModel.getOne({ uuid: uuid }, ['uuid']);
        if (checkUuid != null) {
            let checkOtp = await client.hGet(checkUuid.uuid, 'otp');
            console.log(checkOtp);
            if (checkOtp == otp) {
                // console.log('hh');

                await client.del(checkUuid.uuid);
                logger.info(__filename, req.method, uuid, i18n.__('AUTHOR.verifyOtp.verified'), undefined);
                return helper.createResponse(res, res.__('AUTHOR.verifyOtp.verified'), undefined, constants.SUCCESS);
            } else if (checkOtp == null) {
                return helper.createResponse(res, res.__('AUTHOR.verifyOtp.expired'), undefined, undefined);
            }
        }
        return helper.createResponse(res, res.__('AUTHOR.verifyOtp.incorrect'), undefined, constants.VALIDATION_SERVER_ERR);
    } catch (e: any) {
        console.log(e);
        logger.error(__filename, 'verifyOtp', undefined, 'Error During verifyOtp : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const resendOtp = async function (req: customRequest, res: Response) {
    let { uuid }: userInterface = req.body;
    try {
        let checkUuid = await userModel.getOne(
            {
                uuid: uuid,
            },
            ['uuid', 'email']
        );
        if (checkUuid) {
            let otp = userHelper.generateOtp();
            // let date = new Date()
            // let otp_expiry = date;
            let sendEmail = await userHelper.sendEmail(checkUuid.email, undefined, otp);

            await client.hSet(checkUuid.uuid, { otp: otp });
            await client.expire('OTP', 2 * 60);

            // let update = await authorModel.updateAuthor({
            //     otp: otp,
            //     otp_expiry: otp_expiry
            // }, checkUuid.uuid);
            logger.info(__filename, req.method, uuid, i18n.__('AUTHOR.OtpResend.sent'), undefined);
            return helper.createResponse(res, res.__('AUTHOR.OtpResend.sent'), undefined, constants.SUCCESS);
        }
        return helper.createResponse(res, res.__('AUTHOR.OtpResend.not_found'), undefined, constants.NOT_FOUND_ERR);
    } catch (e: any) {
        console.log(e);
        logger.error(__filename, 'resendOtp', undefined, 'Error During resendOtp : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const resetPassword = async function (req: customRequest, res: Response) {
    let { uuid, new_password }: { uuid: userInterface; new_password: string } = req.body;
    try {
        console.log(new_password);

        let check: any = await userModel.getOne({ uuid: uuid }, ['uuid', 'otp']);
        if (check) {
            if (check.otp === null) {
                let update = await userModel.updateUser({ password: new_password }, check.uuid);
                logger.info(__filename, req.method, check.uuid, res.__('AUTHOR.Reset_pwd.success'), undefined);
                return helper.createResponse(res, res.__('AUTHOR.Reset_pwd.success'), undefined, constants.SUCCESS);
            }
            return helper.createResponse(res, res.__('AUTHOR.Reset_pwd.verify'), undefined, undefined);
        }
        return helper.createResponse(res, res.__('AUTHOR.Reset_pwd.incorrect'), undefined, constants.VALIDATION_SERVER_ERR);
    } catch (e: any) {
        console.log(e);
        logger.error(__filename, 'resendOtp', undefined, 'Error During resendOtp : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const updateUser = async (req: customRequest, res: Response) => {
    let userUuid: string = req.params.uuid;
    try {
        let { first_name, last_name, display_name, email, password, phone_number } = req.body;
        let body: userInterface = {
            first_name: first_name,
            last_name: last_name,
            display_name: display_name,
            email: email,
            password: password,
            phone_number: phone_number,
        };

        let image: any = await userModel.getOne({ uuid: userUuid }, ['id', 'profile_image']);
        // console.log(image.dataValues.reputation);
        if (!image) {
            return helper.createResponse(res, res.__('NOT_FOUND'), undefined, constants.NOT_FOUND_ERR);
        }

        let profile_image = req.files.profile_image ? req.files.profile_image : image.profile_image;

        if (req.files.profile_image) {
            let imageExtension = path.extname(profile_image.name);
            let profile_imageName = 'img-' + Date.now() + imageExtension;

            if (image.profile_image) {
                let url = image.profile_image;
                let imageName = url.substring(url.lastIndexOf('/') + 1);

                await S3.deleteimageToS3(imageName);
            }

            let bufferFile = Buffer.from(profile_image.data, 'binary');
            await S3.uploadimageToS3(profile_imageName, bufferFile);

            body.profile_image = profile_imageName;
        }

        await userModel.updateUser(body, { uuid: userUuid });
        let data = await userModel.getOne({ uuid: userUuid });

        return helper.createResponse(res, res.__('USER.updated'), data, constants.SUCCESS);
    } catch (e: any) {
        logger.error(__filename, 'updateProject', userUuid, 'Error During update project : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const deleteUser = async (req: customRequest, res: Response) => {
    let userUuid: string = req.params.uuid;
    try {
        let image: any = await userModel.getOne({ uuid: userUuid }, ['profile_image']);
        // console.log(image.profile_image);

        let removeUser = await userModel.deleteUser(userUuid);

        if (!removeUser) {
            return helper.createResponse(res, res.__('NOT_FOUND'), undefined, constants.NOT_FOUND_ERR);
        }

        if (image.profile_image) {
            // Delete in AWs-S3
            let url = image.profile_image;
            let coverimageName = url.substring(url.lastIndexOf('/') + 1);

            let deleteObjectPromise = await S3.deleteimageToS3(coverimageName);
        }

        return helper.createResponse(res, res.__('USER.deleted'), undefined, constants.SUCCESS);
    } catch (e) {
        console.log(e);
        logger.error(__filename, 'DeleteUser', userUuid, 'Error During Delete User : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

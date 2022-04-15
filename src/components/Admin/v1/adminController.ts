import { Response } from 'express';
import { customRequest } from '../../../environment';
import adminModel from '../model';
import bcrypt from 'bcrypt';
import helper from '../../../utils/helper';
import { client } from '../../../utils/Redis';
import logger from '../../../utils/logger';
import constants from '../../../utils/constants';

export const login = async function (req: customRequest, res: Response) {
    try {
        // throw new Error('custom error');
        let { email, password }: { email: string; password: string | Buffer } = req.body;

        let admin: any = await adminModel.getOne({ email: email }, ['uuid', 'password']);

        if (admin) {
            // console.log(user.password);

            let validatePwd = bcrypt.compareSync(password, admin.password);
            // console.log(validatePwd);
            if (validatePwd) {
                let jwtToken: any = await helper.jwtToken(admin.uuid);

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
        logger.error(__filename, 'login', undefined, 'Error During login : ', e);
        return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR);
    }
};

export const logout = async function (req: customRequest, res: Response) {
    let token = req.headers.authorization;
    let uuid: any = req.custom?.adminUuid;
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

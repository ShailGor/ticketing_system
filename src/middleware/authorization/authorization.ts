import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import { customRequest } from '../../environment';

import jwt from 'jsonwebtoken';
import path from 'path';
import constants from '../../utils/constants';
import userModel from '../../components/User/model';
import logger from '../../utils/logger';
import helper from '../../utils/helper';
import adminModel from '../../components/Admin/model';
import { client } from '../../utils/Redis';

/**
 * @description Route Authorization for status check
 * @param {Object} req
 * @param {Object} res
 * @param {Object} next
 */

export const authentication = async function (req: customRequest, res: Response, next: NextFunction) {
    try {
        const token: string = req.headers.authorization as string;

        if (!token) {
            return helper.createResponse(res, res.__('JWT_TOKEN.Apply'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        const jwtToken: any = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
        const uuid: string = jwtToken.uuid;
        // console.log(jwtToken);

        const verify_token = await client.hGet(uuid, 'jwt_token');
        if (!verify_token) {
            return helper.createResponse(res, res.__('JWT_TOKEN.not_matched'), undefined, constants.UNAUTHORIZED);
        }

        const admin_uuid: any = await adminModel.getOne({ uuid: uuid }, ['uuid']);

        const verify_uuid: any = await userModel.getOne(
            {
                uuid: uuid,
            },
            ['uuid']
        );
        if (!verify_uuid && !admin_uuid) {
            return helper.createResponse(res, res.__('JWT_TOKEN.not_found'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        req.custom = {};
        req.custom.uuid = verify_uuid?.uuid;
        req.custom.adminUuid = admin_uuid?.uuid;

        next();
    } catch (e: any) {
        if (e.name == 'TokenExpiredError') {
            return helper.createResponse(res, res.__('JWT_TOKEN.expired'), undefined, constants.UNAUTHORIZED);
        } else if (e.name == 'JsonWebTokenError') {
            return helper.createResponse(res, res.__('JWT_TOKEN.invalid'), undefined, constants.UNAUTHORIZED);
        } else {
            console.log(e);
            logger.error(__filename, req.method, undefined, e.message, undefined);
            return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.VALIDATION_SERVER_ERR);
        }
    }
};

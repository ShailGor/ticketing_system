import { NextFunction, Response } from 'express';
import { customRequest } from '../../../environment';
import constants from '../../../utils/constants';
import helper from '../../../utils/helper';
import { checkImageSize, checkImageType, isEmail, isEmpty } from '../../../utils/validator/customValidations';
import { userInterface } from '../types/userTypes';
import isLength from 'validator/lib/isLength';

class UserValidations {
    add(req: customRequest, res: Response, next: NextFunction) {
        let { first_name, last_name, display_name, email, password, phone_number } = req.body;

        if (!first_name) {
            return helper.createResponse(res, res.__('USER.Validations.first_name.required'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (parseInt(first_name) || isEmpty(first_name)) {
            return helper.createResponse(res, res.__('USER.Validations.first_name.valid'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        if (!last_name) {
            return helper.createResponse(res, res.__('USER.Validations.last_name.required'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (parseInt(last_name) || isEmpty(last_name)) {
            return helper.createResponse(res, res.__('USER.Validations.last_name.valid'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        if (!display_name) {
            return helper.createResponse(res, res.__('USER.Validations.display_name.required'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (parseInt(display_name) || isEmpty(display_name)) {
            return helper.createResponse(res, res.__('USER.Validations.display_name.valid'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        if (!email) {
            return helper.createResponse(res, res.__('USER.Validations.email.required'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (parseInt(email) || isEmpty(email)) {
            return helper.createResponse(res, res.__('USER.Validations.email.valid'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (!isEmail(email)) {
            return helper.createResponse(res, res.__('USER.Validations.email.correct'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        if (!password) {
            return helper.createResponse(res, res.__('USER.Validations.password.required'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (parseInt(password) || isEmpty(password)) {
            return helper.createResponse(res, res.__('USER.Validations.password.valid'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (!isLength(password, { min: 8, max: 16 })) {
            return helper.createResponse(res, res.__('USER.Validations.password.length'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        if (!phone_number) {
            return helper.createResponse(res, res.__('USER.Validations.phone_number.required'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (!parseInt(phone_number) || isEmpty(phone_number)) {
            return helper.createResponse(res, res.__('USER.Validations.phone_number.valid'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        if (checkImageSize(req.files.coverimage) === false) {
            return helper.createResponse(res, res.__('USER.Validations.profile_image.size'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (checkImageType(req.files.coverimage) === false) {
            return helper.createResponse(res, res.__('USER.Validations.profile_image.type'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        next();
    }

    update(req: customRequest, res: Response, next: NextFunction) {
        let { first_name, last_name, display_name, email, password, phone_number } = req.body;

        if (req.body.first_name != null) {
            if (parseInt(first_name) || isEmpty(first_name)) {
                return helper.createResponse(res, res.__('USER.Validations.first_name.valid'), undefined, constants.VALIDATION_SERVER_ERR);
            }
        }
        if (req.body.last_name != null) {
            if (parseInt(last_name) || isEmpty(last_name)) {
                return helper.createResponse(res, res.__('USER.Validations.last_name.valid'), undefined, constants.VALIDATION_SERVER_ERR);
            }
        }
        if (req.body.display_name != null) {
            if (parseInt(display_name) || isEmpty(display_name)) {
                return helper.createResponse(res, res.__('USER.Validations.display_name.valid'), undefined, constants.VALIDATION_SERVER_ERR);
            }
        }
        if (req.body.email != null) {
            if (parseInt(email) || isEmpty(email)) {
                return helper.createResponse(res, res.__('USER.Validations.email.valid'), undefined, constants.VALIDATION_SERVER_ERR);
            } else if (!isEmail(email)) {
                return helper.createResponse(res, res.__('USER.Validations.email.correct'), undefined, constants.VALIDATION_SERVER_ERR);
            }
        }
        if (req.body.password != null) {
            if (parseInt(password) || !isLength(password, { min: 8, max: 16 }) || isEmpty(password)) {
                return helper.createResponse(res, res.__('USER.Validations.password.valid'), undefined, constants.VALIDATION_SERVER_ERR);
            }
        }
        if (req.body.phone_number != null) {
            if (!parseInt(phone_number) || isEmpty(phone_number)) {
                return helper.createResponse(res, res.__('USER.Validations.phone_number.valid'), undefined, constants.VALIDATION_SERVER_ERR);
            }
        }
        if (checkImageSize(req.files.coverimage) === false) {
            return helper.createResponse(res, res.__('USER.Validations.profile_image.size'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (checkImageType(req.files.coverimage) === false) {
            return helper.createResponse(res, res.__('USER.Validations.profile_image.type'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        next();
    }

    login(req: customRequest, res: Response, next: NextFunction) {
        let { email, password }: userInterface = req.body;

        if (!email) {
            return helper.createResponse(res, res.__('USER.Validations.login.email'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        if (!password) {
            return helper.createResponse(res, res.__('USER.Validations.login.password'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        next();
    }

    forgotPassword(req: customRequest, res: Response, next: NextFunction) {
        let { name } = req.body;

        if (!name) {
            return helper.createResponse(res, res.__('USER.Validations.forgotPassword.name'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        next();
    }
    otpVerify(req: customRequest, res: Response, next: NextFunction) {
        let { uuid, otp } = req.body;

        if (!uuid) {
            return helper.createResponse(res, res.__('USER.Validations.otpVerify.uuid'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        if (!otp) {
            return helper.createResponse(res, res.__('USER.Validations.otpVerify.otp'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        next();
    }
    resendOtp(req: customRequest, res: Response, next: NextFunction) {
        let uuid = req.body.uuid;
        console.log('aa', uuid);

        if (!uuid) {
            return helper.createResponse(res, res.__('USER.Validations.resendOtp.uuid'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        next();
    }
    resetPassword(req: customRequest, res: Response, next: NextFunction) {
        let { uuid, new_password } = req.body;

        if (!uuid) {
            return helper.createResponse(res, res.__('USER.Validations.resetPassword.uuid'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        if (!new_password) {
            return helper.createResponse(res, res.__('USER.Validations.resetPassword.new_password'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        next();
    }
}
export default new UserValidations();

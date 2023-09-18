import { NextFunction, Response } from 'express';
import { customRequest } from '../../../environment';
import constants from '../../../utils/constants';
import helper from '../../../utils/helper';
import { checkImageSize, checkImageType, isEmpty } from '../../../utils/validator/customValidations';

class AnswerValidation {
    add(req: customRequest, res: Response, next: NextFunction) {
        const { user_id, question_id, answer, is_accepted } = req.body;

        if (!answer) {
            return helper.createResponse(res, res.__('ANSWER.Validations.answer.required'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (parseInt(answer) || isEmpty(answer)) {
            return helper.createResponse(res, res.__('ANSWER.Validations.answer.valid'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        if (checkImageSize(req.files.answer_image) === false) {
            return helper.createResponse(res, res.__('ANSWER.Validations.answer_image.size'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (checkImageType(req.files.answer_image) === false) {
            return helper.createResponse(res, res.__('ANSWER.Validations.answer_image.type'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        next();
    }
    update(req: customRequest, res: Response, next: NextFunction) {
        const { user_id, question_id, answer, is_accepted } = req.body;

        if (answer) {
            if (parseInt(answer) || isEmpty(answer)) {
                return helper.createResponse(res, res.__('ANSWER.Validations.answer.valid'), undefined, constants.VALIDATION_SERVER_ERR);
            }
        }
        if (checkImageSize(req.files.answer_image) === false) {
            return helper.createResponse(res, res.__('ANSWER.Validations.answer_image.size'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (checkImageType(req.files.answer_image) === false) {
            return helper.createResponse(res, res.__('ANSWER.Validations.answer_image.type'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        next();
    }
}

export default new AnswerValidation();

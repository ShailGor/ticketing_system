import { NextFunction, Response } from 'express';
import { customRequest } from '../../../environment';
import constants from '../../../utils/constants';
import helper from '../../../utils/helper';
import { isEmpty } from '../../../utils/validator/customValidations';

class QuestionValidation {
    add(req: customRequest, res: Response, next: NextFunction) {
        let { user_id, title, description, is_published } = req.body;

        if (!title) {
            return helper.createResponse(res, res.__('QUESTION.Validations.title.required'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (parseInt(title) || isEmpty(title)) {
            return helper.createResponse(res, res.__('QUESTION.Validations.title.valid'), undefined, constants.VALIDATION_SERVER_ERR);
        }

        if (!description) {
            return helper.createResponse(res, res.__('QUESTION.Validations.description.required'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (parseInt(description) || isEmpty(description)) {
            return helper.createResponse(res, res.__('QUESTION.Validations.description.valid'), undefined, constants.VALIDATION_SERVER_ERR);
        }

        if (!is_published) {
            return helper.createResponse(res, res.__('QUESTION.Validations.is_published.required'), undefined, constants.VALIDATION_SERVER_ERR);
        }

        next();
    }
    update(req: customRequest, res: Response, next: NextFunction) {
        let { user_id, title, description, is_published } = req.body;

        if (title) {
            if (parseInt(title) || isEmpty(title)) {
                return helper.createResponse(res, res.__('QUESTION.Validations.title.valid'), undefined, constants.VALIDATION_SERVER_ERR);
            }
        }

        if (description) {
            if (parseInt(description) || isEmpty(description)) {
                return helper.createResponse(res, res.__('QUESTION.Validations.description.valid'), undefined, constants.VALIDATION_SERVER_ERR);
            }
        }

        if (is_published) {
            if (isEmpty(is_published)) {
                return helper.createResponse(res, res.__('QUESTION.Validations.is_published.required'), undefined, constants.VALIDATION_SERVER_ERR);
            }
        }

        next();
    }
}

export default new QuestionValidation();

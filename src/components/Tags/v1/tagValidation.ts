import { NextFunction, Response } from 'express';
import { customRequest } from '../../../environment';
import constants from '../../../utils/constants';
import helper from '../../../utils/helper';
import { isEmpty } from '../../../utils/validator/customValidations';

class TagValidation {
    add(req: customRequest, res: Response, next: NextFunction) {
        let { Tag } = req.body;

        if (!Tag) {
            return helper.createResponse(res, res.__('TAG.Validations.required'), undefined, constants.VALIDATION_SERVER_ERR);
        } else if (parseInt(Tag) || isEmpty(Tag)) {
            return helper.createResponse(res, res.__('TAG.Validations.valid'), undefined, constants.VALIDATION_SERVER_ERR);
        }
        next();
    }
}

export default new TagValidation();

import express, { Request, Response } from 'express';
import authentication from '../../../middleware/authorization';
import * as answerController from './answerController';
import answerValidation from './answerValidations';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.send('Answer APIs');
});

router.get('/list', (req: Request, res: Response) => {
    answerController.list(req, res);
});

router.get('/:uuid', (req: Request, res: Response) => {
    answerController.getAnswer(req, res);
});

router.post('/', [authentication, answerValidation.add], (req: Request, res: Response) => {
    answerController.addAnswer(req, res);
});

router.put('/:uuid', [authentication, answerValidation.update], (req: Request, res: Response) => {
    answerController.updateAnswer(req, res);
});

router.delete('/:uuid', [authentication], (req: Request, res: Response) => {
    answerController.deleteAnswer(req, res);
});

export default router;

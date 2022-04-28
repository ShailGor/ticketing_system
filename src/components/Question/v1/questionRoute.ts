import express, { Request, Response } from 'express';
import authentication from '../../../middleware/authorization';
import * as questionController from './questionController';
import questionValidation from './questionValidation';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.send('Question APIs');
});

router.get('/list', (req: Request, res: Response) => {
    questionController.list(req, res);
});

router.get('/:uuid', (req: Request, res: Response) => {
    questionController.getQuestion(req, res);
});

router.post('/', [authentication, questionValidation.add], (req: Request, res: Response) => {
    questionController.addQuestion(req, res);
});

router.put('/:uuid', [authentication, questionValidation.update], (req: Request, res: Response) => {
    questionController.updateQuestion(req, res);
});

router.put('/answerAccept/:uuid', [authentication], (req: Request, res: Response) => {
    questionController.isAccept(req, res);
});

router.delete('/:uuid', [authentication], (req: Request, res: Response) => {
    questionController.deleteQuestion(req, res);
});

export default router;

import express, { Request, Response } from 'express';
import authentication from '../../../middleware/authorization';
import * as voteController from './voteController';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.send('vote APIs');
});

router.get('/list', (req: Request, res: Response) => {
    voteController.list(req, res);
});

router.get('/:uuid', (req: Request, res: Response) => {
    voteController.getVote(req, res);
});

router.post('/', [authentication], (req: Request, res: Response) => {
    voteController.add(req, res);
});

export default router;

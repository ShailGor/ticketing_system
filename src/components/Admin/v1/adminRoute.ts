import express, { Request, Response } from 'express';
import authentication from '../../../middleware/authorization';
import * as adminController from './adminController';

const router = express.Router();

router.post('/login', (req: Request, res: Response) => {
    adminController.login(req, res);
});

router.post('/logout', [authentication], (req: Request, res: Response) => {
    adminController.logout(req, res);
});

router.post('/resetPassword', [authentication], (req: Request, res: Response) => {
    adminController.resetPassword(req, res);
});

router.get('/userList', [authentication], (req: Request, res: Response) => {
    adminController.userList(req, res);
});

router.get('/postList', [authentication], (req: Request, res: Response) => {
    adminController.questionListByTags(req, res);
});

router.post('/userReport', [authentication], (req: Request, res: Response) => {
    adminController.userReport(req, res);
});

router.post('/tag', [authentication], (req: Request, res: Response) => {
    adminController.addtag(req, res);
});

export default router;

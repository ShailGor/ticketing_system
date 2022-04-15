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

export default router;

import express, { Request, Response } from 'express';
import authentication from '../../../middleware/authorization';
import * as userController from './userController';
import Validations from './userValidation';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.send('User API');
});

router.get('/list', (req: Request, res: Response) => {
    userController.list(req, res);
});

router.get('/email-verification/:token', (req: Request, res: Response) => {
    userController.userVerification(req, res);
});

router.get('/:uuid', (req: Request, res: Response) => {
    userController.getUser(req, res);
});

router.post('/', [Validations.add], (req: Request, res: Response) => {
    userController.addUser(req, res);
});

router.post('/login', [Validations.login], (req: Request, res: Response) => {
    userController.login(req, res);
});

router.post('/forgotPassword', [Validations.forgotPassword], (req: Request, res: Response) => {
    userController.forgotPassword(req, res);
});

router.post('/verifyOtp', [Validations.otpVerify], (req: Request, res: Response) => {
    userController.verifyOtp(req, res);
});

router.post('/resendOtp', [Validations.resendOtp], (req: Request, res: Response) => {
    userController.resendOtp(req, res);
});

router.post('/resetPassword', [Validations.resetPassword], (req: Request, res: Response) => {
    userController.resetPassword(req, res);
});

router.post('/logout', [authentication], (req: Request, res: Response) => {
    userController.logout(req, res);
});

router.put('/:uuid', [authentication, Validations.update], (req: Request, res: Response) => {
    userController.updateUser(req, res);
});

router.delete('/:uuid', [authentication], (req: Request, res: Response) => {
    userController.deleteUser(req, res);
});

export default router;

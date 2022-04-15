import { Application } from 'express';
import userRoutes from '../components/User/v1';
import questionRoutes from '../components/Question/v1';
import answerRoutes from '../components/Answer/v1';
import voteRoutes from '../components/Votes/v1';
import adminRoute from '../components/Admin/v1';

export default (app: Application) => {
    app.use('/user', userRoutes);
    app.use('/question', questionRoutes);
    app.use('/answer', answerRoutes);
    app.use('/vote', voteRoutes);
    app.use('/admin', adminRoute);
};

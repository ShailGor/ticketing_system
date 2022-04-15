import express, { Request, Response } from 'express';
import middleware from './middleware';
import routes from './routes';
import logger from './utils/logger';

const app: express.Application = express();

middleware(app);
routes(app);

app.get('/health', (req: Request, res: Response) => {
    return res.status(200).send('healthy');
});

app.all('/*', (req: Request, res: Response) => {
    logger.info(__filename, 'Invalid Route Handler', undefined, 'Bad Request', undefined);
    return res.status(400).json({
        status: 400,
        message: 'Bad Request',
    });
});

export default app;

import { createClient } from 'redis';
import logger from '../logger';

export const client = createClient();

export default async () => {
    await client.connect();
    console.log('Redis client Connected!');
    // logger.info(__filename, '', '', `Redis client Connected!`, ``);
};

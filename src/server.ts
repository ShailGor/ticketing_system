import { createServer } from 'http';
import app from './app';
import sequelize from './utils/dbConfig';
import logger from './utils/logger';
import redis from './utils/Redis';

const PORT = 3000;

const server = createServer(app);

sequelize.sync();

(async () => {
    try {
        await sequelize.authenticate();
        console.log('DB connection has been established sucessfully..');
        // logger.info(__filename, 'server', undefined, `DB Connection has been established successfully`, ``);

        await redis();

        server.listen(PORT, function () {
            console.log('Express listening on port ' + PORT);
            // logger.info(__filename, 'server', '', `Server is running on ${PORT}`, ``);
        });
    } catch (error) {
        console.log('Unable to connect to the server');
        // logger.error(__filename, 'server', '', `Unable to connect to the server`, error);
    }
})();

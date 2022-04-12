import { existsSync, mkdirSync } from 'fs';
import { utc } from 'moment';
import { Logger, transports } from 'winston';

class Logging {
    public logger: any;
    // static error: any;

    private logLevel: string = 'silly';

    // constructor() {
    //     this.logger = winston.createLogger({
    //         transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'src/utils/logger/app.log' })],
    //     });
    // }
    constructor() {
        this.logger = new Logger({
            transports: this.transportList(),
            exceptionHandlers: this.transportList(),
        });
    }

    public error(fileName: string, method: string | undefined, uuid: string | undefined, msg: string, data: any = {}) {
        this.setLabel(fileName, method);
        this.logger.error(`${uuid} - ${msg}`, data ? data : '', '');
    }

    public info(fileName: string, method: string | undefined, uuid: string | undefined, msg: string, data: any = {}) {
        this.setLabel(fileName, method);
        this.logger.info(`${uuid} - ${msg}`, data ? data : '', '');
    }

    public silly(fileName: string, method: string, uuid: string, msg: string, data: any = {}) {
        this.setLabel(fileName, method);
        this.logger.silly(`${uuid} - ${msg}`, data ? data : '', '');
    }

    public setFileLevel(level: string) {
        this.logger.transports.file.level = level;
    }

    public setConsoleLevel(level: string) {
        this.logger.transports.console.level = level;
    }

    public setLabel(fileName: string, method: string | null = null) {
        let label = this.getLabel(fileName);
        label += method ? ` ~ ${method}` : '';
        this.logger.transports.console['label'] = label;
        this.logger.transports.file['label'] = label;
    }

    private getLabel = (fileName: string) => {
        const parts = fileName.split('/');
        return parts[parts.length - 2] + '/' + parts.pop();
    };

    private filePath = () => {
        const dir = __dirname + '/';
        if (!existsSync(dir)) {
            mkdirSync(dir);
        }
        return dir + `/logs_${utc().format('YYYY-MM-DD')}_.log`;
    };

    private fileOption = () => {
        return {
            level: this.logLevel,
            filename: this.filePath(),
            maxsize: 16777216, // Maximum size of a log file should be 16MB
            maxFiles: 64, // Maximum 64 file of 16 MB to be stored. i.e Max 1GB of logs can be stored
            handleExceptions: true,
            label: null, // Display file name
            json: false, // write error in json object or plain text
            depth: '',
            colorize: false,
            // silent: true    // Uncomment to turn off logging
        };
    };

    private consoleOption = () => {
        return {
            level: this.logLevel,
            handleExceptions: true,
            label: null, // Display file name
            json: false, // write error in json object or plain text
            depth: false,
            colorize: true, // for colorized error (i.e red for error, green for info)
            // silent: true // Uncomment to turn off logging
        };
    };

    private transportList = () => {
        return [new transports.Console(this.consoleOption()), new transports.File(this.fileOption())];
    };
}

export default new Logging();

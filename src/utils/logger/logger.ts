import winston from 'winston';

class Logging {
    public logger: any;
    // static error: any;

    constructor() {
        this.logger = winston.createLogger({
            transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'src/utils/logger/app.log' })],
        });
    }

    public error(fileName: string, method: string | undefined, uuid: string | undefined, msg: string, data: any = {}) {
        // this.setLabel(fileName, method);
        const parts = fileName.split('/');
        let file = parts[parts.length - 2] + '/' + parts.pop();
        this.logger.error(`${file}, ~ ${method}, ${uuid} - ${msg}, ${data}`);
    }

    public info(fileName: string, method: string | undefined, uuid: string | undefined, msg: string, data: any = {}) {
        // this.setLabel(fileName, method);
        const parts = fileName.split('/');
        let file = parts[parts.length - 2] + '/' + parts.pop();
        this.logger.info(`${file}, ~ ${method}, ${uuid} - ${msg}, ${data}`);
    }

    public setFileLevel(level: string) {
        this.logger.transports.file.level = level;
    }

    public setConsoleLevel(level: string) {
        this.logger.transports.console.level = level;
    }

    // public setLabel(fileName: any, method: string | undefined) {
    //     let label = this.getLabel(fileName);
    //     label += method ? ` ~ ${method}` : '';
    //     this.logger.transports.console['label'] = label;
    //     this.logger.transports.file['label'] = label;
    // }

    // private getLabel = (fileName: string) => {
    //     const parts = fileName.split('/');
    //     return parts[parts.length - 2] + '/' + parts.pop();
    // };
}

export default new Logging();

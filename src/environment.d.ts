import { Request } from 'express';

declare namespace Environment {
    export interface customRequest extends Request {
        custom?: {
            uuid?: String;
            adminUuid?: String;
        };
        files?: any;
    }
}

export = Environment;

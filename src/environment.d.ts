import { Request } from 'express';

declare namespace Environment {
    export interface customRequest extends Request {
        custom?: {
            uuid?: string;
            adminUuid?: string;
        };
        files?: any;
    }
}

export = Environment;

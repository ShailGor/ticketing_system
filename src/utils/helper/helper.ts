import { Response } from 'express';
import jwt from 'jsonwebtoken';

export function createResponse(res: Response, message: string, Data: any, status: number | undefined) {
    const response_status: {
        status: number | undefined;
        message: string;
        payload: any;
    } = {
        status: status,
        message: message,
        payload: Data,
    };
    return res.send(response_status);
}

export function pagination(
    page: number,
    recordsPerPage: number,
    totalRecords: number,
    data: any,
    sortField: string | undefined,
    sortOrder: any,
    res: Response
) {
    return res.send({
        status: 200,
        message: 'Data are: ',
        payload: data,
        pager: {
            sortField: sortField,
            sortOrder: sortOrder,
            recordsPerPage: recordsPerPage,
            totalRecords: totalRecords,
            page: page,
        },
    });
}

export const getDefaultSortOrder = (sortOrder: string): string => {
    const order: string =
        sortOrder && ['asc', 'desc'].indexOf(sortOrder.toLowerCase()) !== -1 ? (sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC') : 'DESC';
    return order;
};

export async function jwtToken(uuid: string) {
    const token: any = jwt.sign(
        {
            uuid: uuid,
        },
        process.env.JWT_SECRET_KEY as string,
        {
            expiresIn: '2h',
        }
    );
    return token;
}

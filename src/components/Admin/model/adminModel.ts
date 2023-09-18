import { Admin } from '../schema/adminSchema';

export async function getOne(condition: any = {}, attributes: string[] = [], other: object = {}): Promise<false | Admin | null> {
    try {
        return await Admin.findOne({
            where: condition,
            attributes: attributes.length > 0 ? attributes : undefined,
        });
    } catch (error) {
        return false;
    }
}

export async function updateadmin(data: any, condition: any = {}): Promise<any | boolean> {
    try {
        const updateObj = await Admin.update(data, {
            where: condition,
        });
        return updateObj;
    } catch (e) {
        return false;
    }
}

// let data = async () => {
//     let data = Admin.create({
//         first_name: 'Shail',
//         last_name: 'Gor',
//         display_name: 'Admin',
//         email: 'admin@system.com',
//         password: 'smartShail@123',
//         phone_number: '9876543210',
//     });
//     return data;
// };
// data();
// console.log(data());

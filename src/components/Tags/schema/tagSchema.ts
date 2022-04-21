import 'dotenv/config';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/dbConfig';

export class Tag extends Model {
    public id!: number;
    public tag!: string;
}

Tag.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        tag: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Tag',
        tableName: 'tags',
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    }
);

// let data = async () => {
//     let data = await Tag.create({
//         tag: 'css',
//     });
//     return data;
// };

// console.log(data());

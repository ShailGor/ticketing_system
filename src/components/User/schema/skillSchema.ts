import 'dotenv/config';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/dbConfig';

export class Skill extends Model {
    public id!: number;
    public skill!: string;
}

Skill.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        skill: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Skill',
        tableName: 'skills',
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    }
);

// let data = async () => {
//     let data = Skill.create({
//         skill: 'javascript',
//     });
//     return data;
// };

// console.log(data());

import 'dotenv/config';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/dbConfig';

export class UserSkills extends Model {
    public id!: number;
    public user_id!: number;
    public skill_id!: number;
}

UserSkills.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'User',
                key: 'id',
            },
        },
        skill_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'Skill',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        modelName: 'UserSkills',
        tableName: 'user_skills',
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    }
);

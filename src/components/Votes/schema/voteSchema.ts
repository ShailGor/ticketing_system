import 'dotenv/config';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/dbConfig';

export class Vote extends Model {
    public id!: number;
    public uuid!: string;
    public user_id!: number;
    public question_id!: number;
    public answer_id!: number;
    public vote!: Boolean;
}

Vote.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        uuid: {
            type: DataTypes.STRING,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
        },
        question_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
        },
        answer_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
        },
        vote: {
            type: DataTypes.BOOLEAN,
        },
    },
    {
        sequelize,
        modelName: 'Vote',
        tableName: 'votes',
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    }
);

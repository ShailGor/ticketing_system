import 'dotenv/config';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/dbConfig';

export class QuestionTags extends Model {
    public id!: number;
    public question_id!: number;
    public tag_id!: number;
}

QuestionTags.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        question_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'Question',
                key: 'id',
            },
        },
        tag_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            references: {
                model: 'Tag',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        modelName: 'QuestionTags',
        tableName: 'question_tags',
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    }
);

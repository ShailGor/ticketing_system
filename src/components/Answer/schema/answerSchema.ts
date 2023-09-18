import 'dotenv/config';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/dbConfig';

export class Answer extends Model {
    public id!: number;
    public uuid!: string;
    public user_id!: number;
    public question_id!: number;
    public answer!: string;
    public is_accepted!: boolean;
    public answer_image!: string | null;
}

Answer.init(
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
        answer: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        is_accepted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        answer_image: {
            type: DataTypes.STRING,
            defaultValue: null,
            get() {
                const imageUrl = this.getDataValue('answer_image');
                if (imageUrl == null) {
                    return imageUrl;
                }
                return (process.env.AWS_IMAGE_URL as string) + imageUrl;
            },
        },
    },
    {
        sequelize,
        modelName: 'Answer',
        tableName: 'answers',
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    }
);

import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/dbConfig';
import bcrypt from 'bcrypt';

export class Admin extends Model {
    public id!: number;
    public uuid!: string;
    public first_name!: string;
    public last_name!: string;
    public display_name!: string;
    public email!: string;
    public password!: string;
    public phone_number!: string;
    public profile_image!: string | null;
}

Admin.init(
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
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        display_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            set: function (value: string) {
                let salt: string | Buffer = bcrypt.genSaltSync(10);
                let hashedPassword: string | Buffer = bcrypt.hashSync(value, salt);
                this.setDataValue('password', hashedPassword);
            },
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        profile_image: {
            type: DataTypes.STRING,
            defaultValue: null,
            get() {
                const imageUrl = this.getDataValue('profile_image');
                if (imageUrl == null) {
                    return imageUrl;
                }
                return (process.env.AWS_IMAGE_URL as string) + imageUrl;
            },
        },
    },
    {
        sequelize,
        modelName: 'Admin',
        tableName: 'admin',
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    }
);

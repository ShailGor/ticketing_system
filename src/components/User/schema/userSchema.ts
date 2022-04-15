import 'dotenv/config';
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../utils/dbConfig';
import bcrypt from 'bcrypt';
import { Question } from '../../Question/schema/questionSchema';
import { Answer } from '../../Answer/schema/answerSchema';
import { Skill } from './skillSchema';
import { UserSkills } from './userSkillsSchema';
import Vote from '../../Votes/schema';
import Score from '../../Score/schema';

export class User extends Model {
    public id!: number;
    public uuid!: string;
    public first_name!: string;
    public last_name!: string;
    public display_name!: string;
    public email!: string;
    public is_email_verified!: Boolean;
    public password!: string;
    public is_moderator!: Boolean;
    public phone_number!: string;
    public profile_image!: string | null;
    // public created_at!: Date;
    // public updated_at!: Date;
}

User.init(
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
        is_email_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
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
        is_moderator: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
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
        modelName: 'User',
        tableName: 'users',
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        // timestamps: false,
    }
);

export const userSkill = Skill.hasMany(UserSkills, {
    foreignKey: 'user_id',
    sourceKey: 'id',
    as: 'userSkills',
});

//one user have many skills
User.belongsToMany(Skill, {
    through: {
        model: 'UserSkills',
    },
    as: 'skills',
    foreignKey: 'user_id',
    sourceKey: 'id',
});

//one skill have many users
Skill.belongsToMany(User, {
    through: {
        model: 'UserSkills',
    },
    as: 'users',
    foreignKey: 'skill_id',
    sourceKey: 'id',
});

// one user can post many questions
User.hasMany(Question, {
    foreignKey: 'user_id',
    sourceKey: 'id',
});
Question.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    targetKey: 'id',
});

// one user can give many answers
User.hasMany(Answer, {
    foreignKey: 'user_id',
    sourceKey: 'id',
});
Answer.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    targetKey: 'id',
});

// one user can give many votes
User.hasMany(Vote, {
    foreignKey: 'user_id',
    sourceKey: 'id',
});
Vote.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    targetKey: 'id',
});

// one user has many scores
User.hasMany(Score, {
    foreignKey: 'user_id',
    sourceKey: 'id',
});
Score.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    targetKey: 'id',
});

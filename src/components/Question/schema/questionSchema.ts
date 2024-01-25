import 'dotenv/config'
import { DataTypes, Model } from 'sequelize'
import sequelize from '../../../utils/dbConfig'

export class Question extends Model {
	public id!: number
	public uuid!: string
	public user_id!: number
	public title!: string
	public description!: string
	public is_published!: boolean
	public image!: string | null
}

Question.init(
	{
		id: {
			type: DataTypes.BIGINT.UNSIGNED,
			autoIncrement: true,
			primaryKey: true
		},
		uuid: {
			type: DataTypes.STRING,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false
		},
		user_id: {
			type: DataTypes.BIGINT.UNSIGNED,
			allowNull: false
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false
		},
		is_published: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		image: {
			type: DataTypes.STRING,
			defaultValue: null,
			get() {
				const imageUrl = this.getDataValue('image')
				if (imageUrl == null) {
					return imageUrl
				}
				return (process.env.AWS_IMAGE_URL as string) + imageUrl
			}
		}
	},
	{
		sequelize,
		modelName: 'Question',
		tableName: 'questions',
		paranoid: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		deletedAt: 'deleted_at'
	}
)

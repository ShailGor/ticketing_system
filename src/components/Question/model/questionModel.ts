import { Transaction } from 'sequelize'
import { User } from '../../User/schema'
import Question from '../schema'
import { questionTag } from '../schema'
import Tag from '../../Tags/schema'
import { questionInterface } from '../types/questionTypes'
import { Answer } from '../../Answer/schema/answerSchema'
import sequelize from 'sequelize'
import logger from '../../../utils/logger'

export async function getMany(page: number, recordsPerPage: number, condition: any, tagCondition: any = {}, order: any, attributes: string[] = [], other: object = {}) {
	const { count, rows } = await Question.findAndCountAll({
		where: condition,
		attributes: {
			include: [
				[sequelize.literal('(SELECT COUNT(vote) FROM votes where votes.question_id = Question.id  and vote = true)'), 'upVote'],
				[sequelize.literal('(SELECT COUNT(vote) FROM votes where votes.question_id = Question.id  and vote = false)'), 'downVote']
			],
			exclude: ['id', 'updated_at', 'deleted_at']
		},
		distinct: true,
		include: [
			{
				model: Tag,
				as: 'tags',
				where: tagCondition,
				attributes: ['tag'],
				through: { attributes: [] }
			},
			{
				model: User,
				as: 'user',
				attributes: ['display_name', 'email']
			},
			{
				model: Answer,
				as: 'answers',
				attributes: ['answer', 'answer_image', 'user_id'],
				include: [
					{
						model: User,
						as: 'user',
						attributes: ['display_name', 'email']
					}
				]
			}
		],
		order: order,
		offset: page,
		limit: recordsPerPage,
		...other,
		logging: console.log
	})
	return { count, rows }
}

export async function getOne(condition: any = {}, attributes: string[] = [], other: object = {}): Promise<false | Question | null> {
	try {
		const Data = await Question.findOne({
			where: condition,
			attributes: attributes.length > 0 ? attributes : undefined,
			include: [
				{
					model: Tag,
					as: 'tags',
					attributes: ['tag'],
					through: { attributes: [] }
				},
				{
					model: User,
					as: 'user',
					attributes: ['display_name', 'email']
				},
				{
					model: Answer,
					attributes: ['answer', 'answer_image', 'user_id', 'is_accepted'],
					include: [
						{
							model: User,
							as: 'user',
							attributes: ['display_name', 'email']
						}
					]
				}
			],
			...other
		})
		return Data
	} catch (error) {
		console.log(error)
		return false
	}
}

export async function addQuestion(data: any, transaction: Transaction | undefined = undefined): Promise<Question | boolean> {
	try {
		// console.log('data: ', data);

		const insertedObj: any = await Question.create(data, {
			include: {
				association: questionTag
			},
			transaction: transaction ? transaction : undefined
		})
		return insertedObj
	} catch (e) {
		logger.error(__filename, 'addOne', '', 'LeaveDisbursement Model - addOne', e)
		throw new Error('Fail to add leave disbursement in database')
	}
}

export async function updateQuestion(data: questionInterface, Uuid: string, transaction: Transaction | undefined = undefined): Promise<any | boolean> {
	try {
		const updateObj = await Question.update(data, {
			where: { uuid: Uuid },
			transaction: transaction ? transaction : undefined
		})
		return updateObj
	} catch (e) {
		return false
	}
}

export async function deleteQuestion(Uuid: string, transaction: Transaction | undefined = undefined): Promise<any | boolean> {
	try {
		const deleteData = await Question.destroy({
			where: { uuid: Uuid },
			transaction: transaction ? transaction : undefined
		})
		return deleteData
	} catch (error) {
		return false
	}
}

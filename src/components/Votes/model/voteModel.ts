import { Transaction } from 'sequelize'
import Question from '../../Question/schema'
import { User } from '../../User/schema'
import Vote from '../schema'
import logger from '../../../utils/logger'

export async function getMany(attributes: string[] = []) {
	const data = await Vote.findAll({
		attributes: attributes.length > 0 ? attributes : undefined,
		include: [
			{
				model: User,
				as: 'user',
				attributes: ['display_name', 'email']
			},
			{
				model: Question,
				as: 'question',
				attributes: ['title', 'description', 'image'],
				include: [
					{
						model: User,
						as: 'user',
						attributes: ['display_name', 'email']
					}
				]
			}
		]
		// order: order,
		// offset: page,
		// limit: recordsPerPage,
	})
	return data
}

export async function countVote(condition: any = {}): Promise<number | false> {
	try {
		return await Vote.count({
			where: condition
		})
	} catch (e) {
		return false
	}
}

export async function getOne(condition: any = {}, attributes: string[] = [], other: object = {}): Promise<false | Vote | null> {
	try {
		return await Vote.findOne({
			where: condition,
			attributes: attributes.length > 0 ? attributes : undefined,
			include: [
				{
					model: User,
					as: 'user',
					attributes: ['display_name', 'email']
				}
			],
			...other
		})
	} catch (error) {
		console.log(error)
		return false
	}
}

export async function addVote(data: any, transaction: Transaction | undefined = undefined): Promise<Vote | boolean> {
	try {
		const insertedObj: any = await Vote.create(data, {
			transaction: transaction ? transaction : undefined
		})
		return insertedObj
	} catch (e) {
		logger.error(__filename, 'addVote', '', 'Vote Model - addOne', e)
		throw new Error('Fail to add votein database')
	}
}

export async function updateVote(data: any, Uuid: string, transaction: Transaction | undefined = undefined): Promise<any | boolean> {
	try {
		const updateObj = await Vote.update(data, {
			where: { uuid: Uuid },
			transaction: transaction ? transaction : undefined
		})
		return updateObj
	} catch (e) {
		return false
	}
}

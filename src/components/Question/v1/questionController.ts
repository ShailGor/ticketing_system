import { Request, Response } from 'express'
import path from 'path'
import { Op } from 'sequelize'
import { customRequest } from '../../../environment'
import S3 from '../../../utils/aws'
import constants from '../../../utils/constants'
import sequelize from '../../../utils/dbConfig'
import helper from '../../../utils/helper'
import logger from '../../../utils/logger'
import answerModel from '../../Answer/model'
import scoreModel from '../../Score/model'
import userModel from '../../User/model'
import voteModel from '../../Votes/model'
import questionModel from '../model'
import { associateInterface, questionInterface } from '../types/questionTypes'
import * as questionHelper from './questionHelper'

const questionAttributes = ['id', 'uuid', 'title', 'description', 'is_published', 'image', 'created_at', 'updated_at']

export const list = async (req: Request, res: Response) => {
	try {
		let { page, recordsPerPage, sortOrder } = req.body
		const { search } = req.body

		sortOrder = helper.getDefaultSortOrder(sortOrder)
		const { orderBy, sortField, condition, tagCondition } = questionHelper.getOrderByfield(search, sortOrder)

		condition.push({
			is_published: true
		})

		page = page ? page : 1
		recordsPerPage = recordsPerPage ? recordsPerPage : 10

		if (typeof page !== 'number' || typeof recordsPerPage !== 'number') {
			return helper.createResponse(res, res.__('PAGE'), null, constants.VALIDATION_SERVER_ERR)
		}

		const startPage = (page - 1) * recordsPerPage

		const { count, rows }: any = await questionModel.getMany(startPage, recordsPerPage, condition, tagCondition, orderBy, questionAttributes)

		//Total Votes given in the question(upVote and downVote)
		// for (let i = 0; i < rows.length; i++) {
		// 	rows[i].dataValues.upVote = await voteModel.countVote({
		// 		[Op.and]: [{ question_id: rows[i].id }, { vote: true }]
		// 	})
		// 	rows[i].dataValues.downVote = await voteModel.countVote({
		// 		[Op.and]: [{ question_id: rows[i].id }, { vote: false }]
		// 	})
		// }

		rows.map(function(question: any) {
			question.user = question.dataValues.user.dataValues.display_name
			question.tags = question.tags.map(function(tagtemp: any) {
				return tagtemp.dataValues.tag
			})
		})
		console.log('🚀 ~ rows.map ~ rows:', rows[0].answers[0].user)

		return res.render('pages/index.ejs', { questionresult: rows })
		return helper.pagination(page, recordsPerPage, count, rows, sortField, sortOrder, res)
	} catch (e) {
		logger.error(__filename, 'List', undefined, 'List ', e)
		return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR)
	}
}

export const getQuestion = async (req: Request, res: Response) => {
	const questionUuid: string = req.params.uuid
	try {
		const Data: any = await questionModel.getOne(
			{
				uuid: questionUuid
			},
			questionAttributes
		)

		// Total Votes given in the question(upVote and downVote)
		Data.dataValues.upVote = await voteModel.countVote({
			[Op.and]: [{ question_id: Data.id }, { vote: true }]
		})
		Data.dataValues.downVote = await voteModel.countVote({
			[Op.and]: [{ question_id: Data.id }, { vote: false }]
		})

		if (Data) {
			logger.info(__filename, 'details', questionUuid, 'details ', res.__('QUESTION.List'))
			return helper.createResponse(res, res.__('QUESTION.List'), Data, constants.SUCCESS)
		} else {
			return helper.createResponse(res, res.__('NOT_FOUND'), undefined, constants.NOT_FOUND_ERR)
		}
	} catch (e) {
		logger.error(__filename, 'details', questionUuid, 'details ', e)
		return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR)
	}
}

export const addQuestion = async (req: customRequest, res: Response) => {
	let transaction
	try {
		const { user_id, title, description, is_published, tags } = req.body
		const body: associateInterface = {
			user_id: user_id,
			title: title,
			description: description,
			is_published: is_published,
			tags: tags
		}

		const tags_array: any = JSON.parse(body.tags!)
		// console.log(tags_array);
		body.questionTags = tags_array.map((t_id: number) => {
			return { tag_id: t_id }
		})
		// console.log(body.questionTags);

		const image = req.files.image ? req.files.image : null

		if (image !== null) {
			const imageExtension = path.extname(image.name)
			const imageName = 'img-' + Date.now() + imageExtension

			const bufferFile = Buffer.from(image.data, 'binary')

			await S3.uploadimageToS3(imageName, bufferFile)

			body.image = imageName
		}

		transaction = await sequelize.transaction()
		const addQuestion: any = await questionModel.addQuestion(body)
		await transaction.commit()

		return helper.createResponse(res, res.__('QUESTION.created'), addQuestion, constants.SUCCESS)
	} catch (e) {
		if (transaction) await transaction.rollback()
		logger.error(__filename, 'addQuestion', undefined, 'Error During add new question : ', e)
		return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR)
	}
}

export const updateQuestion = async (req: customRequest, res: Response) => {
	let transaction
	const user_uuid: any = req.custom?.uuid
	const admin: any = req.custom?.adminUuid
	const questionUuid: string = req.params.uuid

	try {
		// check user is moderator or not
		// let admin: any = await adminModel.getOne({ uuid: user_uuid });
		console.log(admin)
		let User: any
		if (user_uuid) {
			User = await userModel.getOne({ uuid: user_uuid }, ['id', 'is_moderator'])
		}
		const Question_Data: any = await questionModel.getOne({ uuid: questionUuid }, ['user_id'])

		if (admin || Question_Data.user_id === User.id || User.is_moderator == 'true') {
			const { user_id, title, description, is_published } = req.body
			const body: questionInterface = {
				user_id: user_id,
				title: title,
				description: description,
				is_published: is_published
			}

			const imageFile: any = await questionModel.getOne({ uuid: questionUuid }, ['image'])

			const image = req.files.image ? req.files.image : imageFile.image

			if (req.files.image) {
				const imageExtension = path.extname(image.name)
				const imageName = 'img-' + Date.now() + imageExtension

				if (imageFile.image) {
					const url = imageFile.image
					const imageName = url.substring(url.lastIndexOf('/') + 1)

					await S3.deleteimageToS3(imageName)
				}

				const bufferFile = Buffer.from(image.data, 'binary')
				await S3.uploadimageToS3(imageName, bufferFile)

				body.image = imageName
			}

			transaction = await sequelize.transaction()
			await questionModel.updateQuestion(body, questionUuid, transaction)
			await transaction.commit()

			const data = await questionModel.getOne({ uuid: questionUuid }, questionAttributes)

			return helper.createResponse(res, res.__('QUESTION.updated'), data, constants.SUCCESS)
		}
		return helper.createResponse(res, res.__('QUESTION.not_access'), undefined, constants.UNAUTHORIZED)
	} catch (e) {
		if (transaction) await transaction.rollback()
		logger.error(__filename, 'updatequestion', questionUuid, 'Error During update question : ', e)
		return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR)
	}
}

export const deleteQuestion = async (req: customRequest, res: Response) => {
	let transaction
	const user_uuid: any = req.custom?.uuid
	const admin: any = req.custom?.adminUuid
	const questionUuid: string = req.params.uuid

	try {
		// console.log(admin);
		// check user is moderator or not
		let User: any
		if (user_uuid) {
			User = await userModel.getOne({ uuid: user_uuid }, ['id', 'is_moderator'])
		}
		const Question_Data: any = await questionModel.getOne({ uuid: questionUuid }, ['user_id'])

		if (Question_Data.user_id === User.id || User.is_moderator == 'true' || admin == true) {
			const imageFile: any = await questionModel.getOne({ uuid: questionUuid }, ['image'])
			// console.log(image.profile_image);

			if (imageFile.image) {
				// Delete in AWs-S3
				const url = imageFile.image
				const imageName = url.substring(url.lastIndexOf('/') + 1)

				await S3.deleteimageToS3(imageName)
			}

			transaction = await sequelize.transaction()
			const removeUser = await questionModel.deleteQuestion(questionUuid, transaction)
			await transaction.commit()

			if (!removeUser) {
				return helper.createResponse(res, res.__('NOT_FOUND'), undefined, constants.NOT_FOUND_ERR)
			}

			return helper.createResponse(res, res.__('QUESTION.deleted'), undefined, constants.SUCCESS)
		}
		return helper.createResponse(res, res.__('QUESTION.not_access'), undefined, constants.UNAUTHORIZED)
	} catch (e) {
		console.log(e)
		if (transaction) await transaction.rollback()
		logger.error(__filename, 'DeleteQuestion', questionUuid, 'Error During Delete Question : ', e)
		return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR)
	}
}

export const isAccept = async (req: customRequest, res: Response) => {
	const questionUuid: string = req.params.uuid
	const { answerUuid } = req.body
	const user_uuid: any = req.custom?.uuid
	try {
		let User: any
		if (user_uuid) {
			User = await userModel.getOne({ uuid: user_uuid })
		}

		const Question_Data: any = await questionModel.getOne({ uuid: questionUuid }, ['id', 'user_id'])

		if (User) {
			if (Question_Data.user_id === User.id) {
				const answerData: any = await answerModel.getOne({ question_id: Question_Data.id }, ['user_id', 'is_accepted'])

				if (answerData.is_accepted != true) {
					const answer: any = await answerModel.updateAns({ is_accepted: 1 }, { [Op.and]: { uuid: answerUuid, question_id: Question_Data.id } })

					if (answer == true) {
						await scoreModel.addScore({
							user_id: answerData.user_id,
							reputation: 10,
							criteria: 'Answer Accepted'
						})
					}
					return helper.createResponse(res, res.__('QUESTION.answerAccept.Accepted'), undefined, constants.SUCCESS)
				}
				return helper.createResponse(res, res.__('QUESTION.answerAccept.already'), undefined, constants.VALIDATION_SERVER_ERR)
			}
			return helper.createResponse(res, res.__('QUESTION.answerAccept.wrong'), undefined, constants.UNAUTHORIZED)
		}
		return helper.createResponse(res, res.__('QUESTION.answerAccept.no_acess'), undefined, constants.UNAUTHORIZED)
	} catch (e) {
		console.log(e)
		logger.error(__filename, 'DeleteQuestion', questionUuid, 'Error During Delete Question : ', e)
		return helper.createResponse(res, res.__('INTERNAL_SERVER_ERR'), undefined, constants.INTERNAL_SERVER_ERR)
	}
}

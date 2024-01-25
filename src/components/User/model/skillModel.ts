import { Skill } from '../schema/skill/skillSchema'

export async function getMany(condition: any = {}, attributes: string[] = [], other: object = {}) {
	try {
		const result: any = await Skill.findAll({
			attributes: attributes,
			where: condition,
			...other
		})

		return result
	} catch (e) {
		return false
	}
}

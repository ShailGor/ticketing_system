import { Answer } from '../../Answer/schema/answerSchema'
import Tag from '../../Tags/schema'
import Vote from '../../Votes/schema'
import { Question } from './questionSchema'
import { QuestionTags } from './questionTagsSchema'

export const questionTag = Tag.hasMany(QuestionTags, {
	foreignKey: 'question_id',
	sourceKey: 'id',
	as: 'questionTags'
})

//one question have many Tag
Question.belongsToMany(Tag, {
	through: {
		model: 'QuestionTags'
	},
	as: 'tags',
	foreignKey: 'question_id',
	sourceKey: 'id'
})

//one Tag have many Question
Tag.belongsToMany(Question, {
	through: {
		model: 'QuestionTags'
	},
	as: 'questions',
	foreignKey: 'tag_id',
	sourceKey: 'id'
})

// one question has many answers
Question.hasMany(Answer, {
	foreignKey: 'question_id',
	sourceKey: 'id',
	as: 'answers'
})

Answer.belongsTo(Question, {
	foreignKey: 'question_id',
	as: 'question',
	targetKey: 'id'
})

// one question has many votes
Question.hasMany(Vote, {
	foreignKey: 'question_id',
	sourceKey: 'id'
})

Vote.belongsTo(Question, {
	foreignKey: 'question_id',
	as: 'question',
	targetKey: 'id'
})

export default Question

import express, { Request, Response } from 'express'
import { getMany } from '../../User/model/skillModel'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
	res.render('pages/index.ejs')
})

router.get('/login', (req: Request, res: Response) => {
	res.render('pages/login.ejs')
})

router.get('/register', async (req: Request, res: Response) => {
	const skills = await getMany({}, ['id', 'skill'])
	console.log(skills.length)

	res.render('pages/register.ejs', { skills })
})

export default router

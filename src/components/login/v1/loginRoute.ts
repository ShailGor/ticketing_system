import express, { Request, Response } from 'express'

const router = express.Router()

router.get('/login', (req: Request, res: Response) => {
	res.render('pages/login.ejs')
})

export default router

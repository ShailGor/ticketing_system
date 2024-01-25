import express, { Request, Response } from 'express'
import middleware from './middleware'
import routes from './routes'
import logger from './utils/logger'
import path from 'path'
import ejs from 'ejs'
import expressLayouts from 'express-ejs-layouts'

// const session = require('express-session')

const app: express.Application = express()

// frontend
app.locals.baseURL = process.env.URL_HOST
app.use(express.static('./'))
app.use(express.static('./public'))
app.set('views', path.join(__dirname, 'views'))
app.engine('html', ejs.renderFile)
app.set('view engine', 'html')
app.use(expressLayouts)
app.set('layout', 'layout.ejs')
app.use(express.static(path.join(__dirname, 'public')))

// Use the session middleware for frontend
// app.use(session({ secret: 'keyboard cat', cookie: { expires: Number(process.env.LOGIN_TIMEOUT) } }));
app.use((req, res, next) => {
	res.set('Cache-Control', 'no-store')
	next()
})

middleware(app)
routes(app)

app.get('/health', (req: Request, res: Response) => {
	return res.status(200).send('healthy')
})

app.all('/*', (req: Request, res: Response) => {
	logger.info(__filename, 'Invalid Route Handler', undefined, 'Bad Request', undefined)
	return res.status(400).json({
		status: 400,
		message: 'Bad Request'
	})
})

export default app

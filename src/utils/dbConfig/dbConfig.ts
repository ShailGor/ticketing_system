import 'dotenv/config';
import { Sequelize } from 'sequelize';

const DB_NAME: any = process.env.DB_NAME;
const DB_USER: any = process.env.DB_USER;
const DB_PASSWORD: any = process.env.DB_PASSWORD;
const DB_HOSt: any = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT as string);

// console.log(DB_HOSt);

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOSt,
  port: dbPort,
  dialect: 'mysql',
  logging: false,
});

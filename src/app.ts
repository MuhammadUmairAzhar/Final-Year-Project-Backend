import express, { Express, NextFunction, Request, Response } from 'express';
import * as dotenv from "dotenv";
import morgan from 'morgan';
import cors from 'cors';
import connectDB  from './config/db';
import studentRoutes from './routes/student';
import advisorRoutes from './routes/advisor';
import panelRoutes from './routes/panel';
import adminRoutes from './routes/admin';
import commonRoutes from './routes/common';

dotenv.config({ path: __dirname + '/config/config.env' })

connectDB()

const app: Express = express()
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());

if(process.env.NODE_ENV == 'developement') {
    app.use(morgan('dev'));
}

app.get('/', (req: Request, res: Response, next: NextFunction) => res.status(200).json({ message: "Server running"} ))

app.use('/student', studentRoutes)
app.use('/advisor', advisorRoutes)
app.use('/panel', panelRoutes)
app.use('/admin', adminRoutes)
app.use('/user', commonRoutes)

app.listen(process.env.PORT, () =>
    console.log(`Server ready at http://localhost:${process.env.PORT}`)
)
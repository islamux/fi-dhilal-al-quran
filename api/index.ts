import express from 'express';
import healthRouter from '../server/routes/health';
import userDataRouter from '../server/routes/userData';

const app = express();
app.use(express.json());
app.use(healthRouter);
app.use(userDataRouter);

export default app;

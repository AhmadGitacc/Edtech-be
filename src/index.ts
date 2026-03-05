import express from 'express';
import http from 'http';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import router from './router';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

dotenv.config();

const app = express();

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use(cors({
    credentials: true,
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));

app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server started on port http://localhost:${PORT}/`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

app.use('/', router());
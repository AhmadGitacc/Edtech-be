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
import fs from 'fs';

dotenv.config();

const app = express();

const swaggerPath = path.resolve(__dirname, '../src/swagger.yaml');
let swaggerDocument;

if (fs.existsSync(swaggerPath)) {
    swaggerDocument = YAML.load(swaggerPath);
} else {
    console.warn("WARNING: swagger.yaml not found at", swaggerPath);
}

app.use(cors({
    credentials: true,
    origin: process.env.CORS_ORIGIN || '*'
}));

app.use(compression());
app.use(cookieParser());
app.use(express.json());

// Ensure static path is safe
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

if (swaggerDocument) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.use('/', router());

const server = http.createServer(app);
const PORT = parseInt(process.env.PORT, 10) || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
});
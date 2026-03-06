"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const router_1 = __importDefault(require("./router"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const swaggerPath = path_1.default.resolve(__dirname, '../swagger.yaml');
let swaggerDocument;
if (fs_1.default.existsSync(swaggerPath)) {
    swaggerDocument = yamljs_1.default.load(swaggerPath);
}
else {
    console.warn("WARNING: swagger.yaml not found at", swaggerPath);
}
app.use((0, cors_1.default)({
    credentials: true,
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
// Ensure static path is safe
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
if (swaggerDocument) {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
}
app.use('/', (0, router_1.default)());
const server = http_1.default.createServer(app);
const PORT = parseInt(process.env.PORT, 10) || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
});
//# sourceMappingURL=index.js.map
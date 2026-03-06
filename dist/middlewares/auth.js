"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const isAuthenticated = (req, res, next) => {
    const token = req.cookies['auth_token'] || req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, data: null, message: "Unauthorized: No token provided" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ success: false, data: null, message: "Unauthorized: Invalid token" });
    }
};
exports.isAuthenticated = isAuthenticated;
const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, data: null, message: "Forbidden: Admin access required" });
    }
    next();
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=auth.js.map
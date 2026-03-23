"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.signup = exports.login = void 0;
const Users_1 = require("../models/Users");
const ActivityLogs_1 = require("../models/ActivityLogs");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const helpers_1 = require("../helpers");
const JWT_SECRET = process.env.JWT_SECRET;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, data: null, message: "Email and password are required" });
        }
        const user = await (0, Users_1.getUserByEmail)(email);
        if (!user || !user.salt) {
            return res.status(401).json({ success: false, data: null, message: "Unauthorized Access" });
        }
        const expectedHash = (0, helpers_1.authentication)(user.salt, password);
        if (user.password !== expectedHash) {
            return res.status(401).json({ success: false, data: null, message: "Invalid Password" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        await (0, Users_1.setUserStatus)(user.id, true);
        await (0, ActivityLogs_1.createLog)(user.id, user.username, 'LOGIN', `User logged in from ${req.ip}`);
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({
            success: true,
            data: { user: userWithoutPassword, token },
            message: "Login successful"
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.login = login;
const signup = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        if (!email || !username || !password) {
            return res.status(400).json({ success: false, data: null, message: "All fields are required" });
        }
        const existingUser = await (0, Users_1.getUserByEmail)(email);
        if (existingUser) {
            return res.status(400).json({ success: false, data: null, message: "User already exists" });
        }
        const salt = (0, helpers_1.random)();
        const passwordHash = (0, helpers_1.authentication)(salt, password);
        const userId = await (0, Users_1.createUser)(username, email, passwordHash, salt);
        return res.status(201).json({
            success: true,
            data: { id: userId, username, email },
            message: "User registered successfully"
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.signup = signup;
const logout = async (req, res) => {
    try {
        res.clearCookie('auth_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    }
    catch (err) {
        console.error("Critical Logout Failure:", err);
        res.clearCookie('auth_token');
        return res.status(200).json({
            success: true,
            message: "Session cleared with errors"
        });
    }
};
exports.logout = logout;
//# sourceMappingURL=Auth.js.map
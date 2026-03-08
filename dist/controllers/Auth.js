"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Users_1 = require("../models/Users");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, data: null, message: "Email and password are required" });
        }
        const user = await (0, Users_1.getUserByEmail)(email);
        if (!user) {
            return res.status(401).json({ success: false, data: null, message: "Invalid credentials" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, data: null, message: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        // Remove password from response
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
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const userId = await (0, Users_1.createUser)(username, email, passwordHash);
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
//# sourceMappingURL=Auth.js.map
import express from "express";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail, setUserStatus } from "../models/Users";
import { createLog } from "../models/ActivityLogs";
import jwt from "jsonwebtoken";
import { authentication, random } from "../helpers";

const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req: express.Request, res: express.Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, data: null, message: "Email and password are required" });
        }

        const user = await getUserByEmail(email);

       if (!user || !user.salt) {
            return res.status(401).json({ success: false, data: null, message: "Invalid credentials" });
        }

        const expectedHash = authentication(user.salt, password);

        if (user.password !== expectedHash) {
            return res.status(401).json({ success: false, data: null, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET!,
            { expiresIn: '24h' }
        );

        await setUserStatus(user.id, true);
        await createLog(user.id, user.username, 'LOGIN', `User logged in from ${req.ip}`);

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
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const signup = async (req: express.Request, res: express.Response) => {
    try {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({ success: false, data: null, message: "All fields are required" });
        }

        const existingUser = await getUserByEmail(email);

        if (existingUser) {
            return res.status(400).json({ success: false, data: null, message: "User already exists" });
        }

        const salt = random();
        const passwordHash = authentication(salt, password);

        const userId = await createUser(username, email, passwordHash);

        return res.status(201).json({
            success: true,
            data: { id: userId, username, email },
            message: "User registered successfully"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const logout = async (req: express.Request, res: express.Response) => {
    try {
        const user = (req as any).user;
        if (user) {
            await setUserStatus(user.id, false);
            await createLog(user.id, user.username, 'LOGOUT', 'User logged out');
        }

        res.clearCookie('auth_token');
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
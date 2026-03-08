import express from "express";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "../models/Users";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req: express.Request, res: express.Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, data: null, message: "Email and password are required" });
        }

        const user = await getUserByEmail(email);

        if (!user) {
            return res.status(401).json({ success: false, data: null, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password!);

        if (!isMatch) {
            return res.status(401).json({ success: false, data: null, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

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

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

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
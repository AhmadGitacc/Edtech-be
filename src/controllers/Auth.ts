import express from "express";
import { createUser, getUserByEmail, setUserStatus, updateUserById } from "../models/Users";
import { createLog } from "../models/ActivityLogs";
import jwt from "jsonwebtoken";
import { authentication, random } from "../helpers";
import { sendForgotPasswordEmail } from "../helpers/email";

const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req: express.Request, res: express.Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, data: null, message: "Email and password are required" });
        }

        const user = await getUserByEmail(email);

       if (!user || !user.salt) {
            return res.status(401).json({ success: false, data: null, message: "Unauthorized Access" });
        }

        const expectedHash = authentication(user.salt, password);

        if (user.password !== expectedHash) {
            return res.status(401).json({ success: false, data: null, message: "Invalid Password" });
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
            maxAge: 48 * 60 * 60 * 1000 // 48 hours
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

        const userId = await createUser(username, email, passwordHash, salt);

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

    } catch (err) {
        console.error("Critical Logout Failure:", err);
        res.clearCookie('auth_token');
        return res.status(200).json({ 
            success: true, 
            message: "Session cleared with errors" 
        });
    }
};

export const forgotPassword = async (req: express.Request, res: express.Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, data: null, message: "Email is required" });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return res.status(200).json({ success: true, message: "If your email is registered, you will receive an OTP shortly." });
        }

        //6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Expiry time: 15 minutes from now
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        await updateUserById(user.id, {
            reset_otp: otp,
            reset_otp_expires_at: expiresAt
        });

        // Send email
        const emailResult = await sendForgotPasswordEmail(email, otp);
        if (!emailResult.success) {
            console.error("Failed to send forgot password email", emailResult.error);
            // Optionally, we could still return success to not leak that email exists, but let's be honest about the error
            return res.status(500).json({ success: false, data: null, message: "Failed to send OTP email" });
        }

        return res.status(200).json({ success: true, message: "If your email is registered, you will receive an OTP shortly." });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const verifyOtp = async (req: express.Request, res: express.Response) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, data: null, message: "Email and OTP are required" });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(400).json({ success: false, data: null, message: "Invalid email or OTP" });
        }

        if (!user.reset_otp || user.reset_otp !== otp) {
            return res.status(400).json({ success: false, data: null, message: "Invalid OTP" });
        }

        if (!user.reset_otp_expires_at || new Date(user.reset_otp_expires_at) < new Date()) {
            return res.status(400).json({ success: false, data: null, message: "OTP has expired" });
        }

        return res.status(200).json({ success: true, message: "OTP verified successfully" });
    } catch (err) {
        console.error("Verify OTP Error:", err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const resetPassword = async (req: express.Request, res: express.Response) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, data: null, message: "Email, OTP, and new password are required" });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(400).json({ success: false, data: null, message: "Invalid email or OTP" });
        }

        // Verify OTP again
        if (!user.reset_otp || user.reset_otp !== otp) {
            return res.status(400).json({ success: false, data: null, message: "Invalid OTP" });
        }

        if (!user.reset_otp_expires_at || new Date(user.reset_otp_expires_at) < new Date()) {
            return res.status(400).json({ success: false, data: null, message: "OTP has expired" });
        }

        // Hash new password
        const salt = random();
        const passwordHash = authentication(salt, newPassword);

        // Update user
        await updateUserById(user.id, {
            password: passwordHash,
            salt: salt,
            reset_otp: null,
            reset_otp_expires_at: null
        });

        return res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (err) {
        console.error("Reset Password Error:", err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

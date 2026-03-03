import express from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export interface AuthRequest extends express.Request {
    user?: {
        id: number;
        email: string;
        role: string;
    };
}

export const isAuthenticated = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies['auth_token'] || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, data: null, message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, data: null, message: "Unauthorized: Invalid token" });
    }
};

export const isAdmin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, data: null, message: "Forbidden: Admin access required" });
    }
    next();
};

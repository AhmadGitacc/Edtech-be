import pool from '../db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface ActivityLog extends RowDataPacket {
    id: number;
    user_id: number;
    username: string;
    action: string;
    details: string;
    created_at: Date;
}

export const createLog = async (userId: number, username: string, action: string, details: string): Promise<number> => {
    const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO activity_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)',
        [userId, username, action, details]
    );
    return result.insertId;
};

export const getLogs = async (limit: number = 50, offset: number = 0): Promise<ActivityLog[]> => {
    const [rows] = await pool.execute<ActivityLog[]>(
        'SELECT al.*, u.username FROM activity_logs al JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
    );
    return rows;
};

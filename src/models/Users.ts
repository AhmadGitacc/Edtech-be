import pool from '../db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface User extends RowDataPacket {
    id: number;
    username: string;
    email: string;
    password?: string;
    salt?: string;
    role: 'student' | 'admin';
    created_at: Date;
}

export const createUser = async (username: string, email: string, passwordHash: string): Promise<number> => {
    const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, passwordHash]
    );
    return result.insertId;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const [rows] = await pool.execute<User[]>(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );
    return rows[0] || null;
};

export const getUserById = async (id: number): Promise<User | null> => {
    const [rows] = await pool.execute<User[]>(
        'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
        [id]
    );
    return rows[0] || null;
};

export const getUsers = async (): Promise<User[]> => {
    const [rows] = await pool.execute<User[]>(
        'SELECT id, username, email, role, created_at FROM users'
    );
    return rows;
};

export const deleteUserById = async (id: number): Promise<void> => {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
};

export const updateUserById = async (id: number, values: Record<string, any>): Promise<void> => {
    const setClause = Object.keys(values).map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(values), id];
    await pool.execute(`UPDATE users SET ${setClause} WHERE id = ?`, params);
};
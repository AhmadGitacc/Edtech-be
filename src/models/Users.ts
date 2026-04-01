import pool from '../db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface User extends RowDataPacket {
    id: number;
    username: string;
    email: string;
    password?: string;
    salt?: string;
    role: 'student' | 'admin';
    is_active: boolean;
    created_at: Date;
    reset_otp?: string | null;
    reset_otp_expires_at?: Date | null;
}

export const createUser = async (username: string, email: string, passwordHash: string, salt: string): Promise<number> => {
    const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO users (username, email, password, salt) VALUES (?, ?, ?, ?)',
        [username, email, passwordHash, salt]
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

export const getUsers = async (search?: string, limit: number = 40, offset: number = 0): Promise<User[]> => {
    let query = 'SELECT id, username, email, role, is_active, created_at FROM users';
    const params: any[] = [];

    if (search) {
        query += ' WHERE username LIKE ? OR email LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute<User[]>(query, params);
    return rows;
};

export const deleteUserById = async (id: number): Promise<void> => {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
};

export const updateUserById = async (id: number, values: Record<string, any>): Promise<void> => {
    const keys = Object.keys(values);
    if (keys.length === 0) return;
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(values), id];
    await pool.execute(`UPDATE users SET ${setClause} WHERE id = ?`, params);
};

export const setUserStatus = async (id: number, isActive: boolean): Promise<void> => {
    await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
};

export const getUserStats = async (): Promise<any> => {
    const [rows] = await pool.execute<RowDataPacket[]>(`
        SELECT 
            (SELECT COUNT(*) FROM users WHERE role = 'student') as totalStudents,
            (SELECT COUNT(*) FROM courses) as totalCourses,
            (SELECT SUM(price) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.status = 'success') as revenue,
            (SELECT COUNT(*) FROM enrollments WHERE status = 'success') as totalEnrollments,
            (SELECT COUNT(*) FROM exam_submissions WHERE status = 'pending') as pendingExams
    `);
    
    // Adding placeholder trends as it often requires time-series data
    return {
        ...rows[0],
        trends: {
            revenueGrowth: "+10%",
            studentGrowth: "+5%"
        }
    };
};

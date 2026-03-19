import pool from '../db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface Enrollment extends RowDataPacket {
    id: number;
    user_id: number;
    course_id: number;
    payment_reference: string;
    status: 'pending' | 'success' | 'failed';
}

export const createEnrollment = async (userId: number, courseId: number, reference: string): Promise<void> => {
    await pool.execute(
        'INSERT INTO enrollments (user_id, course_id, payment_reference, status) VALUES (?, ?, ?, "pending")',
        [userId, courseId, reference]
    );
};

export const updateEnrollmentStatus = async (reference: string, status: string): Promise<void> => {
    await pool.execute(
        'UPDATE enrollments SET status = ? WHERE payment_reference = ?',
        [status, reference]
    );
};

export const getEnrollmentByReference = async (reference: string): Promise<Enrollment | null> => {
    const [rows] = await pool.execute<Enrollment[]>(
        'SELECT * FROM enrollments WHERE payment_reference = ?',
        [reference]
    );
    return rows[0] || null;
};

export const getEnrollmentsByUserId = async (userId: number): Promise<RowDataPacket[]> => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT c.id, c.title, c.description, c.price,c.cover_image, e.payment_reference, e.created_at 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE e.user_id = ? AND e.status = 'success'`,
        [userId]
    );
    return rows;
};

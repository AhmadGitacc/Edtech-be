import pool from '../db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface Course extends RowDataPacket {
    id: number;
    title: string;
    description: string;
    cover_image: string;
    price: number;
    category_tag: string | null;
    status: 'active' | 'inactive';
    created_at: Date;
}

export interface Lesson extends RowDataPacket {
    id: number;
    course_id: number;
    title: string;
    content: string;
    video_link: string;
    video_id?: string;
    library_id?: string;
    order_index: number;
}

export const getAllCourses = async (filterActive: boolean = false): Promise<Course[]> => {
    let query = 'SELECT * FROM courses';
    if (filterActive) {
        query += " WHERE status = 'active'";
    }
    const [rows] = await pool.execute<Course[]>(query);
    return rows;
};

export const getCourseById = async (id: number): Promise<Course | null> => {
    const [rows] = await pool.execute<Course[]>('SELECT * FROM courses WHERE id = ?', [id]);
    return rows[0] || null;
};

export const getLessonsByCourseId = async (courseId: number): Promise<Lesson[]> => {
    const [rows] = await pool.execute<Lesson[]>(
        'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC',
        [courseId]
    );
    return rows;
};

export const getLessonById = async (id: number): Promise<Lesson | null> => {
    const [rows] = await pool.execute<Lesson[]>('SELECT * FROM lessons WHERE id = ?', [id]);
    return rows[0] || null;
};

export const trackProgress = async (userId: number, lessonId: number): Promise<void> => {
    await pool.execute(
        'INSERT INTO user_progress (user_id, lesson_id, completed) VALUES (?, ?, true) ON DUPLICATE KEY UPDATE completed = true',
        [userId, lessonId]
    );
};

export const getProgress = async (userId: number, courseId: number): Promise<number[]> => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT lesson_id FROM user_progress up JOIN lessons l ON up.lesson_id = l.id WHERE up.user_id = ? AND l.course_id = ? AND up.completed = true',
        [userId, courseId]
    );
    return rows.map(r => r.lesson_id);
};

export const deleteCourse = async (id: number): Promise<void> => {
    await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
};

export const deleteLesson = async (id: number): Promise<void> => {
    await pool.execute('DELETE FROM lessons WHERE id = ?', [id]);
};

export const setCourseStatus = async (id: number, status: 'active' | 'inactive'): Promise<void> => {
    await pool.execute('UPDATE courses SET status = ? WHERE id = ?', [status, id]);
};

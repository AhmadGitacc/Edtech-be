import pool from '../db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface Category extends RowDataPacket {
    id: number;
    name: string;
    category_tag: string;
    created_at: Date;
}

export const getAllCategories = async (): Promise<Category[]> => {
    const [rows] = await pool.execute<Category[]>('SELECT * FROM categories');
    return rows;
};

export const createCategory = async (name: string, tag: string): Promise<number> => {
    const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO categories (name, category_tag) VALUES (?, ?)',
        [name, tag]
    );
    return result.insertId;
};

import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

export interface Question extends RowDataPacket {
    id: number;
    exam_id: number;
    type: 'objective' | 'theory';
    question_text: string;
    options: string; // JSON string
    correct_option: number;
}

export interface Submission extends RowDataPacket {
    id: number;
    user_id: number;
    exam_id: number;
    objective_score: number;
    theory_score: number | null;
    total_score: number | null;
    status: 'pending' | 'graded' | 'approved';
    created_at: Date;
}

export interface ExamAnswer extends RowDataPacket {
    id: number;
    submission_id: number;
    question_id: number;
    selected_option: number | null;
    theory_answer: string | null;
    score: number;
}

export interface Exam extends RowDataPacket {
    id: number;
    course_id: number;
    pass_percentage: number;
}

export const getExamByCourseId = async (courseId: number): Promise<Exam | null> => {
    const [rows] = await pool.execute<Exam[]>('SELECT * FROM exams WHERE course_id = ?', [courseId]);
    return rows[0] || null;
};

export const getQuestionsByExamId = async (examId: number): Promise<Question[]> => {
    const [rows] = await pool.execute<Question[]>('SELECT * FROM exam_questions WHERE exam_id = ?', [examId]);
    return rows;
};

export const createExam = async (
    courseId: number,
    passPercentage: number,
    title?: string,
    duration?: number
): Promise<number> => {
    const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO exams (course_id, pass_percentage, title, duration) VALUES (?, ?, ?, ?)',
        [
            courseId ?? null,
            passPercentage ?? 70,
            title ?? "Final Assessment",
            duration ?? 30
        ]
    );
    return result.insertId;
};

export const updateExam = async (examId: number, passPercentage: number, title?: string, duration?: number): Promise<void> => {
    await pool.execute('UPDATE exams SET pass_percentage = ?, title = ?, duration = ? WHERE id = ?', [passPercentage, title ?? "Final Assessment", duration ?? 30, examId]);
};

export const deleteExam = async (examId: number): Promise<void> => {
    await pool.execute('DELETE FROM exams WHERE id = ?', [examId]);
};

export const addQuestion = async (examId: number, data: any): Promise<number> => {
    const { 
        type = 'objective', 
        question_text = '', 
        OPTIONS, 
        correct_option = 0 
    } = data;

    const finalOptions = OPTIONS || [];

    const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO exam_questions (exam_id, type, question_text, options, correct_option) VALUES (?, ?, ?, ?, ?)',
        [
            examId, 
            type, 
            question_text, 
            typeof finalOptions === 'string' ? finalOptions : JSON.stringify(finalOptions), 
            correct_option ?? 0 
        ]
    );
    return result.insertId;
};

export const updateQuestion = async (questionId: number, data: any): Promise<void> => {
    const { type, question_text, options, correct_option } = data;
    await pool.execute(
        'UPDATE exam_questions SET type = ?, question_text = ?, options = ?, correct_option = ? WHERE id = ?',
        [type, question_text, JSON.stringify(options), correct_option, questionId]
    );
};

export const deleteQuestion = async (questionId: number): Promise<void> => {
    await pool.execute('DELETE FROM exam_questions WHERE id = ?', [questionId]);
};

export const createSubmission = async (userId: number, examId: number, objectiveScore: number): Promise<number> => {
    const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO exam_submissions (user_id, exam_id, objective_score, status) VALUES (?, ?, ?, "pending")',
        [userId, examId, objectiveScore]
    );
    return result.insertId;
};

export const saveAnswer = async (submissionId: number, questionId: number, data: { selectedOption?: number, theoryAnswer?: string, score: number }) => {
    await pool.execute(
        'INSERT INTO exam_answers (submission_id, question_id, selected_option, theory_answer, score) VALUES (?, ?, ?, ?, ?)',
        [submissionId, questionId, data.selectedOption ?? null, data.theoryAnswer ?? null, data.score]
    );
};

export const getSubmissionById = async (submissionId: number): Promise<Submission | null> => {
    const [rows] = await pool.execute<Submission[]>('SELECT * FROM exam_submissions WHERE id = ?', [submissionId]);
    return rows[0] || null;
};

export const createCertificate = async (userId: number, courseId: number): Promise<string> => {
    const certificateUuid = uuidv4();
    await pool.execute(
        'INSERT INTO certificates (user_id, course_id, certificate_uuid) VALUES (?, ?, ?)',
        [userId, courseId, certificateUuid]
    );
    return certificateUuid;
};

export const getCertificate = async (userId: number, courseId: number): Promise<RowDataPacket | null> => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM certificates WHERE user_id = ? AND course_id = ?',
        [userId, courseId]
    );
    return rows[0] || null;
};

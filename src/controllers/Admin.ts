import express from "express";
import pool from "../db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getAllUsers } from "../models/Users";
import { uploadVideoToBunny } from "../helpers/bunny";
import { createCertificate, createExam, updateExam, deleteExam, addQuestion, updateQuestion, deleteQuestion } from "../models/Exams";
import { sendCertificateEmail } from "../helpers/email";
import fs from 'fs';
import path from 'path';

export const adminGetUsers = async (req: express.Request, res: express.Response) => {
    try {
        const users = await getAllUsers();
        return res.status(200).json({ success: true, data: users, message: "Users fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminCreateCourse = async (req: express.Request, res: express.Response) => {
    try {
        const { title, description, price } = req.body;
        let coverImagePath = null;

        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const uploadsDir = path.join(__dirname, '../../uploads');

            // Ensure directory exists
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const uploadPath = path.join(uploadsDir, fileName);
            fs.writeFileSync(uploadPath, req.file.buffer);
            coverImagePath = `/uploads/${fileName}`;
        }

        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO courses (title, description, price, cover_image) VALUES (?, ?, ?, ?)',
            [title, description, price, coverImagePath]
        );
        return res.status(201).json({ success: true, data: { id: result.insertId, coverImage: coverImagePath }, message: "Course created" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminCreateLesson = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // courseId
        const { title, content, orderIndex, videoLink } = req.body;
        let { videoId, libraryId } = req.body;

        if (req.file) {
            console.log(`Uploading video file: ${req.file.originalname}`);
            videoId = await uploadVideoToBunny(req.file.buffer, req.file.originalname);
            libraryId = process.env.BUNNY_LIBRARY_ID;
            console.log(`Video uploaded successfully. ID: ${videoId}`);
        }

        // if (!videoId || !libraryId) {
        //     return res.status(400).json({ success: false, message: "Video ID and Library ID are required (or upload a video file)" });
        // }

        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO lessons (course_id, title, content, video_id, video_link, library_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, title, content, videoId, videoLink, libraryId, orderIndex]
        );

        return res.status(201).json({ success: true, data: { id: result.insertId, videoId, videoLink, libraryId }, message: "Lesson created" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminGetPendingExams = async (req: express.Request, res: express.Response) => {
    try {
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT es.*, u.username, u.email, e.course_id 
             FROM exam_submissions es
             JOIN users u ON es.user_id = u.id
             JOIN exams e ON es.exam_id = e.id
             WHERE es.status = 'pending'`
        );
        return res.status(200).json({ success: true, data: rows, message: "Pending exams fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminGradeSubmission = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // submissionId
        const { theoryScore } = req.body;

        const [submissionRows] = await pool.execute<RowDataPacket[]>(
            'SELECT objective_score FROM exam_submissions WHERE id = ?',
            [id]
        );

        if (submissionRows.length === 0) {
            return res.status(404).json({ success: false, message: "Submission not found" });
        }

        const totalScore = submissionRows[0].objective_score + Number(theoryScore);

        await pool.execute(
            'UPDATE exam_submissions SET theory_score = ?, total_score = ?, status = "graded" WHERE id = ?',
            [theoryScore, totalScore, id]
        );

        return res.status(200).json({ success: true, message: "Submission graded successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminApproveSubmission = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // submissionId

        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT es.*, e.course_id, e.pass_percentage, u.email 
             FROM exam_submissions es
             JOIN exams e ON es.exam_id = e.id
             JOIN users u ON es.user_id = u.id
             WHERE es.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Submission not found" });
        }

        const submission = rows[0];

        if (submission.status !== 'graded') {
            return res.status(400).json({ success: false, message: "Submission must be graded before approval" });
        }

        // Generate certificate
        const certUuid = await createCertificate(submission.user_id, submission.course_id);

        // Update status
        await pool.execute('UPDATE exam_submissions SET status = "approved" WHERE id = ?', [id]);

        // Send email via Resend
        await sendCertificateEmail(submission.email, certUuid);
        console.log(`Certificate generated: ${certUuid}. Email sent to ${submission.email}`);

        return res.status(200).json({ success: true, data: { certificateUuid: certUuid }, message: "Submission approved and certificate generated." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Exam CRUD
export const adminCreateExam = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // courseId
        const { passPercentage } = req.body;
        const examId = await createExam(Number(id), passPercentage);
        return res.status(201).json({ success: true, data: { id: examId }, message: "Exam created" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminUpdateExam = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // examId
        const { passPercentage } = req.body;
        await updateExam(Number(id), passPercentage);
        return res.status(200).json({ success: true, message: "Exam updated" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminDeleteExam = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // examId
        await deleteExam(Number(id));
        return res.status(200).json({ success: true, message: "Exam deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Question CRUD
export const adminAddQuestion = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // examId
        const questionId = await addQuestion(Number(id), req.body);
        return res.status(201).json({ success: true, data: { id: questionId }, message: "Question added" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminUpdateQuestion = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // questionId
        await updateQuestion(Number(id), req.body);
        return res.status(200).json({ success: true, message: "Question updated" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminDeleteQuestion = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // questionId
        await deleteQuestion(Number(id));
        return res.status(200).json({ success: true, message: "Question deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


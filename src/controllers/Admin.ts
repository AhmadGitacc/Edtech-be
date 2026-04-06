import express from "express";
import pool from "../db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getUsers, setUserStatus, getUserStats, getUserById, updateUserById } from "../models/Users";
import { createCertificate, createExam, updateExam, deleteExam, addQuestion, updateQuestion, deleteQuestion, getExamByCourseId, getQuestionsByExamId } from "../models/Exams";
import { deleteCourse, deleteLesson, setCourseStatus, getAllCourses, updateCourse, updateLesson, getLessonsByCourseId } from "../models/Courses";
import { createCategory } from "../models/Categories";
import { getLogs } from "../models/ActivityLogs";
import { sendCertificateEmail, sendFailedEmail } from "../helpers/email";
import fs from 'fs';
import path from 'path';
import { AuthRequest } from "../middlewares/auth";
import { authentication, random } from "../helpers";

export const adminGetUsers = async (req: express.Request, res: express.Response) => {
    try {
        const { q, limit, offset } = req.query;
        const users = await getUsers(
            q as string,
            limit ? Number(limit) : 20,
            offset ? Number(offset) : 0
        );
        return res.status(200).json({ success: true, data: users, message: "Users fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: `Internal server error ${err}` });
    }
};

export const adminToggleUserStatus = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        await setUserStatus(Number(id), isActive);
        return res.status(200).json({ success: true, message: `User status updated to ${isActive ? 'active' : 'inactive'}` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminUpdateUser = async (req: express.Request, res: express.Response) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ message: "User id required" });

        const { role, password } = req.body;

        const user = await getUserById(Number(userId));
        if (!user) {
            return res.status(404).json({ message: "User doesn't exist" });
        }

        const updateValues: any = {};
        if (role) updateValues.role = role;
        if (password) {
            const salt = random();
            updateValues.salt = salt;
            updateValues.password = authentication(salt, password);
        }

        if (Object.keys(updateValues).length === 0) {
            return res.status(400).json({ message: "No changes detected" });
        }

        await updateUserById(Number(userId), updateValues);

        const safeResponse = {
            id: userId,
            role: role || user.role,
        };

        return res.status(200).json({
            success: true,
            data: safeResponse,
            message: "Profile updated successfully"
        });

    } catch (err) {
        console.error("Update User Error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const adminCreateCourse = async (req: express.Request, res: express.Response) => {
    try {
        const { title, description, price, category_tag } = req.body;
        let coverImagePath = null;

        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;

            const uploadsDir = path.resolve(process.cwd(), 'uploads');

            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const uploadPath = path.join(uploadsDir, fileName);
            fs.writeFileSync(uploadPath, req.file.buffer);

            coverImagePath = `/uploads/${fileName}`;
        }

        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO courses (title, description, price, category_tag, cover_image) VALUES (?, ?, ?, ?, ?)',
            [
                title ?? null,
                description ?? null,
                price ?? 0,
                category_tag ?? null,
                coverImagePath
            ]
        );

        return res.status(201).json({
            success: true,
            data: { id: result.insertId, coverImage: coverImagePath }
        });
    } catch (err) {
        console.error("Upload Error:", err);
        return res.status(500).json({ success: false, message: `Upload failed: ${err}` });
    }
};

export const adminUpdateCourse = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const updateData: any = { ...req.body };

        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT cover_image FROM courses WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const oldImagePath = rows[0].cover_image;
        let newCoverImagePath = oldImagePath;

        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;
            const uploadsDir = path.resolve(process.cwd(), 'uploads');

            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const uploadPath = path.join(uploadsDir, fileName);
            fs.writeFileSync(uploadPath, req.file.buffer);
            newCoverImagePath = `/uploads/${fileName}`;
            updateData.cover_image = newCoverImagePath;

            if (oldImagePath) {
                const oldFileFullPath = path.join(process.cwd(), oldImagePath);
                if (fs.existsSync(oldFileFullPath)) {
                    fs.unlinkSync(oldFileFullPath);
                }
            }
        }

        await updateCourse(Number(id), updateData);
        return res.status(200).json({ success: true, message: "Course updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


export const adminCreateLesson = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // courseId
        const {
            title,
            content,
            orderIndex,
            video_link,
            videoId,
            libraryId
        } = req.body;

        console.log("Creating Lesson with data:", { id, title, video_link, videoId });

        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO lessons 
            (course_id, title, content, video_id, video_link, library_id, order_index) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id ?? null,
                title ?? null,
                content ?? null,
                videoId ?? null,
                video_link ?? null,
                libraryId ?? null,
                orderIndex ?? 0
            ]
        );

        return res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                videoId,
                video_link,
                libraryId
            },
            message: "Lesson created successfully"
        });
    } catch (err) {
        console.error("Database Error in adminCreateLesson:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const adminDeleteCourse = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        await deleteCourse(Number(id));
        return res.status(200).json({ success: true, message: "Course deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminDeleteLesson = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        await deleteLesson(Number(id));
        return res.status(200).json({ success: true, message: "Lesson deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminGetStats = async (req: express.Request, res: express.Response) => {
    try {
        const stats = await getUserStats();
        return res.status(200).json({ success: true, data: stats, message: "Statistics fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminCreateCategory = async (req: express.Request, res: express.Response) => {
    try {
        const { name, tag } = req.body;
        const categoryId = await createCategory(name, tag);
        return res.status(201).json({ success: true, data: { id: categoryId }, message: "Category created" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminGetActivityLogs = async (req: express.Request, res: express.Response) => {
    try {
        const { limit, offset } = req.query;
        const logs = await getLogs(
            limit ? Number(limit) : 50,
            offset ? Number(offset) : 0
        );
        return res.status(200).json({ success: true, data: logs, message: "Activity logs fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminGetPendingExams = async (req: express.Request, res: express.Response) => {
    try {
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                es.id, 
                es.user_id, 
                es.objective_score, 
                es.STATUS, 
                u.username, 
                u.email, 
                c.title AS courseTitle,
                c.id AS courseId,  
                ea.theory_answer, 
                q.question_text
             FROM exam_submissions es
             JOIN users u ON es.user_id = u.id
             JOIN exams e ON es.exam_id = e.id
             JOIN courses c ON e.course_id = c.id
             JOIN exam_answers ea ON es.id = ea.submission_id
             JOIN exam_questions q ON ea.question_id = q.id
             WHERE es.STATUS = 'pending' AND q.TYPE = 'theory'`
        );
        return res.status(200).json({ success: true, data: rows, message: "Pending exams fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminFinalizeSubmission = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // submissionId
        const { theoryScore } = req.body;

        if (theoryScore === undefined) return res.status(400).json({ message: "Theory score is required" });

        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT es.objective_score, e.course_id, e.pass_percentage, u.id AS user_id, u.email 
             FROM exam_submissions es
             JOIN exams e ON es.exam_id = e.id
             JOIN users u ON es.user_id = u.id
             WHERE es.id = ?`,
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ success: false, message: "Submission not found" });

        const { objective_score, pass_percentage, user_id, course_id, email } = rows[0];

        const totalScore = Number(objective_score) + Number(theoryScore);
        const passed = totalScore >= (pass_percentage);
        const finalStatus = passed ? "approved" : "failed";

        await pool.execute(
            'UPDATE exam_submissions SET theory_score = ?, total_score = ?, status = ? WHERE id = ?',
            [theoryScore, totalScore, finalStatus, id]
        );

        let certUuid = null;
        if (passed) {
            certUuid = await createCertificate(user_id, course_id);
            await sendCertificateEmail(email, certUuid);
            console.log(`Certificate ${certUuid} sent to ${email}`);
        } else {
            await sendFailedEmail(email);
            console.log(`Failed email sent to ${email}`);
        }

        return res.status(200).json({
            success: true,
            data: {
                finalScore: totalScore,
                passed,
                certificateUuid: certUuid
            },
            message: passed ? "Graded, approved, and certificate sent!" : "Graded. Candidate did not meet pass requirements."
        });

    } catch (err) {
        console.error("Finalize Error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Exam CRUD
export const adminGetCourseExam = async (req: AuthRequest, res: express.Response) => {
    try {
        const { id } = req.params;
        const exam = await getExamByCourseId(Number(id));
        if (!exam) {
            return res.status(404).json({ success: false, data: null, message: "Exam not found for this course" });
        }
        const questions = await getQuestionsByExamId(exam.id);

        return res.status(200).json({ success: true, data: { exam, questions: questions }, message: "Exam fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const adminCreateExam = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // courseId
        const { passPercentage, title, duration } = req.body;
        const examId = await createExam(Number(id), passPercentage, title, duration);
        return res.status(201).json({ success: true, data: { id: examId }, message: "Exam created" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminUpdateExam = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params; // examId
        const { passPercentage, title, duration } = req.body;
        await updateExam(Number(id), passPercentage, title, duration);
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

export const adminListCourses = async (req: express.Request, res: express.Response) => {
    try {
        const courses = await getAllCourses(false); // All courses
        return res.status(200).json({ success: true, data: courses, message: "All courses fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: `Internal server error ${err}` });
    }
};

export const adminToggleCourseStatus = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }
        await setCourseStatus(Number(id), status);
        return res.status(200).json({ success: true, message: `Course status updated to ${status}` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: `Internal server error ${err}` });
    }
};

export const adminUpdateLesson = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const updateData: any = { ...req.body };

        // Support for dynamic lesson updates
        await updateLesson(Number(id), updateData);
        return res.status(200).json({ success: true, message: "Lesson updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminGetCourseLessons = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const lessons = await getLessonsByCourseId(Number(id));
        return res.status(200).json({ success: true, data: lessons, message: "Course lessons fetched for admin" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const adminGetCertificates = async (req: express.Request, res: express.Response) => {
    try {
        const query = `
            SELECT
                cert.certificate_uuid, 
                cert.created_at AS issue_date,
                c.title AS course_title,
                u.username,
                u.email
            FROM certificates cert
            JOIN courses c ON cert.course_id = c.id
            JOIN users u ON cert.user_id = u.id
            ORDER BY cert.created_at DESC
        `;
        const [rows] = await pool.execute(query);

        return res.status(200).json({ success: true, data: rows, message: "All certificates fetched" });
    } catch (err) {
        console.error("Fetch All Certificates Error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

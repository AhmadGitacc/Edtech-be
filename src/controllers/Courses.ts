import express from "express";
import { getAllCourses, getCourseById, getLessonsByCourseId, getLessonById, trackProgress, getProgress as getProgressModel } from "../models/Courses";
import { getAllCategories } from "../models/Categories";
import { getEnrollmentsByUserId } from "../models/Payments";
import { AuthRequest } from "../middlewares/auth";
import pool from '../db';

export const listCourses = async (req: express.Request, res: express.Response) => {
    try {
        const courses = await getAllCourses(true); // Filter active
        return res.status(200).json({ success: true, data: courses, message: "Courses fetched successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const listCategories = async (req: express.Request, res: express.Response) => {
    try {
        const categories = await getAllCategories();
        return res.status(200).json({ success: true, data: categories, message: "Categories fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const getCourseDetails = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const course = await getCourseById(Number(id));
        if (!course) {
            return res.status(404).json({ success: false, data: null, message: "Course not found" });
        }
        const lessons = await getLessonsByCourseId(Number(id));
        return res.status(200).json({ success: true, data: { ...course, lessons }, message: "Course details fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const getLessonDetails = async (req: AuthRequest, res: express.Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const lesson = await getLessonById(Number(id));
        if (!lesson) {
            return res.status(404).json({ success: false, data: null, message: "Lesson not found" });
        }

        const enrollmentStatus = await getEnrollmentsByUserId(userId);

        if (!enrollmentStatus) {
            return res.status(404).json({ success: false, data: null, message: "User not enrolled for this course" });
        }

        return res.status(200).json({ success: true, data: lesson, message: "Lesson fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const completeLesson = async (req: AuthRequest, res: express.Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.sendStatus(401);

        await trackProgress(userId, Number(id));
        return res.status(200).json({ success: true, data: null, message: "Lesson marked as complete" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: err });
    }
};

export const getCourseLessons = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const lessons = await getLessonsByCourseId(Number(id));
        return res.status(200).json({ success: true, data: lessons, message: "Course lessons fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: err });
    }
};

export const getMyCourses = async (req: AuthRequest, res: express.Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.sendStatus(401);

        const query = `
            SELECT 
                c.id, 
                c.title, 
                c.description, 
                c.cover_image,
                c.price,
                c.category_tag,
                e.STATUS as enrollment_status,
                (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as total_lessons,
                (SELECT COUNT(*) 
                 FROM user_progress up 
                 JOIN lessons l ON up.lesson_id = l.id 
                 WHERE l.course_id = c.id 
                 AND up.user_id = ? 
                 AND up.completed = true) as completed_lessons
            FROM courses c
            JOIN enrollments e ON e.course_id = c.id
            WHERE e.user_id = ?;
        `;

        const [enrollments] = await pool.execute(query, [userId, userId]);

        return res.status(200).json({
            success: true,
            data: enrollments,
            message: "Enrolled courses with progress fetched"
        });
    } catch (err) {
        console.error("Fetch Enrolled Error:", err);
        return res.status(500).json({
            success: false,
            data: null,
            message: "Internal server error"
        });
    }
};

export const getProgress = async (req: AuthRequest, res: express.Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) return res.sendStatus(401);

        const progress = await getProgressModel(userId, Number(id));
        return res.status(200).json({ success: true, data: progress, message: "Course progress fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const getUserCertificate = async (req: AuthRequest, res: express.Response) => {
    try {
        const { courseId } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.sendStatus(401);

        const query = `
            SELECT 
                cert.certificate_uuid, 
                cert.created_at AS issue_date,
                c.title AS course_title,
                u.username
            FROM certificates cert
            JOIN courses c ON cert.course_id = c.id
            JOIN users u ON cert.user_id = u.id
            WHERE cert.user_id = ? AND cert.course_id = ?
        `;

        const [rows]: any = await pool.execute(query, [userId, courseId]);

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                data: null, 
                message: "Certificate not found for this course" 
            });
        }

        return res.status(200).json({ 
            success: true, 
            data: rows[0], 
            message: "Certificate details fetched successfully" 
        });
    } catch (err) {
        console.error("Fetch Certificate Error:", err);
        return res.status(500).json({ 
            success: false, 
            data: null, 
            message: "Internal server error" 
        });
    }
};
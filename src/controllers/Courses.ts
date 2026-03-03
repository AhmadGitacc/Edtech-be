import express from "express";
import { getAllCourses, getCourseById, getLessonsByCourseId, getLessonById, trackProgress, getProgress } from "../models/Courses";
import { getEnrollmentsByUserId } from "../models/Payments";
import { AuthRequest } from "../middlewares/auth";

export const listCourses = async (req: express.Request, res: express.Response) => {
    try {
        const courses = await getAllCourses();
        return res.status(200).json({ success: true, data: courses, message: "Courses fetched successfully" });
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
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const getMyCourses = async (req: AuthRequest, res: express.Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.sendStatus(401);

        const enrollments = await getEnrollmentsByUserId(userId);
        return res.status(200).json({ success: true, data: enrollments, message: "Enrolled courses fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

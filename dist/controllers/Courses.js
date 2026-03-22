"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgress = exports.getMyCourses = exports.getCourseLessons = exports.completeLesson = exports.getLessonDetails = exports.getCourseDetails = exports.listCategories = exports.listCourses = void 0;
const Courses_1 = require("../models/Courses");
const Categories_1 = require("../models/Categories");
const Payments_1 = require("../models/Payments");
const db_1 = __importDefault(require("../db"));
const listCourses = async (req, res) => {
    try {
        const courses = await (0, Courses_1.getAllCourses)(true); // Filter active
        return res.status(200).json({ success: true, data: courses, message: "Courses fetched successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.listCourses = listCourses;
const listCategories = async (req, res) => {
    try {
        const categories = await (0, Categories_1.getAllCategories)();
        return res.status(200).json({ success: true, data: categories, message: "Categories fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.listCategories = listCategories;
const getCourseDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await (0, Courses_1.getCourseById)(Number(id));
        if (!course) {
            return res.status(404).json({ success: false, data: null, message: "Course not found" });
        }
        const lessons = await (0, Courses_1.getLessonsByCourseId)(Number(id));
        return res.status(200).json({ success: true, data: { ...course, lessons }, message: "Course details fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.getCourseDetails = getCourseDetails;
const getLessonDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const lesson = await (0, Courses_1.getLessonById)(Number(id));
        if (!lesson) {
            return res.status(404).json({ success: false, data: null, message: "Lesson not found" });
        }
        const enrollmentStatus = await (0, Payments_1.getEnrollmentsByUserId)(userId);
        if (!enrollmentStatus) {
            return res.status(404).json({ success: false, data: null, message: "User not enrolled for this course" });
        }
        return res.status(200).json({ success: true, data: lesson, message: "Lesson fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.getLessonDetails = getLessonDetails;
const completeLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.sendStatus(401);
        await (0, Courses_1.trackProgress)(userId, Number(id));
        return res.status(200).json({ success: true, data: null, message: "Lesson marked as complete" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: err });
    }
};
exports.completeLesson = completeLesson;
const getCourseLessons = async (req, res) => {
    try {
        const { id } = req.params;
        const lessons = await (0, Courses_1.getLessonsByCourseId)(Number(id));
        return res.status(200).json({ success: true, data: lessons, message: "Course lessons fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: err });
    }
};
exports.getCourseLessons = getCourseLessons;
const getMyCourses = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.sendStatus(401);
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
        const [enrollments] = await db_1.default.execute(query, [userId, userId]);
        return res.status(200).json({
            success: true,
            data: enrollments,
            message: "Enrolled courses with progress fetched"
        });
    }
    catch (err) {
        console.error("Fetch Enrolled Error:", err);
        return res.status(500).json({
            success: false,
            data: null,
            message: "Internal server error"
        });
    }
};
exports.getMyCourses = getMyCourses;
const getProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.sendStatus(401);
        const progress = await (0, Courses_1.getProgress)(userId, Number(id));
        return res.status(200).json({ success: true, data: progress, message: "Course progress fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.getProgress = getProgress;
//# sourceMappingURL=Courses.js.map
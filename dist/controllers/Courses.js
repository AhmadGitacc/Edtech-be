"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyCourses = exports.completeLesson = exports.getLessonDetails = exports.getCourseDetails = exports.listCourses = void 0;
const Courses_1 = require("../models/Courses");
const Payments_1 = require("../models/Payments");
const listCourses = async (req, res) => {
    try {
        const courses = await (0, Courses_1.getAllCourses)();
        return res.status(200).json({ success: true, data: courses, message: "Courses fetched successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.listCourses = listCourses;
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
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.completeLesson = completeLesson;
const getMyCourses = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.sendStatus(401);
        const enrollments = await (0, Payments_1.getEnrollmentsByUserId)(userId);
        return res.status(200).json({ success: true, data: enrollments, message: "Enrolled courses fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.getMyCourses = getMyCourses;
//# sourceMappingURL=Courses.js.map
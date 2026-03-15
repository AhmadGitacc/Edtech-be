"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetCourseLessons = exports.adminUpdateLesson = exports.adminToggleCourseStatus = exports.adminListCourses = exports.adminDeleteQuestion = exports.adminUpdateQuestion = exports.adminAddQuestion = exports.adminDeleteExam = exports.adminUpdateExam = exports.adminCreateExam = exports.adminGetCourseExam = exports.adminApproveSubmission = exports.adminGradeSubmission = exports.adminGetPendingExams = exports.adminGetActivityLogs = exports.adminCreateCategory = exports.adminGetStats = exports.adminDeleteLesson = exports.adminDeleteCourse = exports.adminCreateLesson = exports.adminUpdateCourse = exports.adminCreateCourse = exports.adminToggleUserStatus = exports.adminGetUsers = void 0;
const db_1 = __importDefault(require("../db"));
const Users_1 = require("../models/Users");
const Exams_1 = require("../models/Exams");
const Courses_1 = require("../models/Courses");
const Categories_1 = require("../models/Categories");
const ActivityLogs_1 = require("../models/ActivityLogs");
const email_1 = require("../helpers/email");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const adminGetUsers = async (req, res) => {
    try {
        const { q, limit, offset } = req.query;
        const users = await (0, Users_1.getUsers)(q, limit ? Number(limit) : 20, offset ? Number(offset) : 0);
        return res.status(200).json({ success: true, data: users, message: "Users fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: `Internal server error ${err}` });
    }
};
exports.adminGetUsers = adminGetUsers;
const adminToggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        await (0, Users_1.setUserStatus)(Number(id), isActive);
        return res.status(200).json({ success: true, message: `User status updated to ${isActive ? 'active' : 'inactive'}` });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminToggleUserStatus = adminToggleUserStatus;
const adminCreateCourse = async (req, res) => {
    try {
        const { title, description, price } = req.body;
        let coverImagePath = null;
        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;
            const uploadsDir = path_1.default.resolve(process.cwd(), 'uploads');
            if (!fs_1.default.existsSync(uploadsDir)) {
                fs_1.default.mkdirSync(uploadsDir, { recursive: true });
            }
            const uploadPath = path_1.default.join(uploadsDir, fileName);
            fs_1.default.writeFileSync(uploadPath, req.file.buffer);
            coverImagePath = `/uploads/${fileName}`;
        }
        const [result] = await db_1.default.execute('INSERT INTO courses (title, description, price, cover_image) VALUES (?, ?, ?, ?)', [title, description, price, coverImagePath]);
        return res.status(201).json({
            success: true,
            data: { id: result.insertId, coverImage: coverImagePath }
        });
    }
    catch (err) {
        console.error("Upload Error:", err);
        return res.status(500).json({ success: false, message: `Upload failed: ${err}` });
    }
};
exports.adminCreateCourse = adminCreateCourse;
const adminUpdateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        const [rows] = await db_1.default.execute('SELECT cover_image FROM courses WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        const oldImagePath = rows[0].cover_image;
        let newCoverImagePath = oldImagePath;
        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;
            const uploadsDir = path_1.default.resolve(process.cwd(), 'uploads');
            if (!fs_1.default.existsSync(uploadsDir)) {
                fs_1.default.mkdirSync(uploadsDir, { recursive: true });
            }
            const uploadPath = path_1.default.join(uploadsDir, fileName);
            fs_1.default.writeFileSync(uploadPath, req.file.buffer);
            newCoverImagePath = `/uploads/${fileName}`;
            updateData.cover_image = newCoverImagePath;
            if (oldImagePath) {
                const oldFileFullPath = path_1.default.join(process.cwd(), oldImagePath);
                if (fs_1.default.existsSync(oldFileFullPath)) {
                    fs_1.default.unlinkSync(oldFileFullPath);
                }
            }
        }
        await (0, Courses_1.updateCourse)(Number(id), updateData);
        return res.status(200).json({ success: true, message: "Course updated successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminUpdateCourse = adminUpdateCourse;
const adminCreateLesson = async (req, res) => {
    try {
        const { id } = req.params; // courseId
        const { title, content, orderIndex, videoLink, videoId, libraryId } = req.body;
        console.log("Creating Lesson with data:", { id, title, videoLink, videoId });
        const [result] = await db_1.default.execute(`INSERT INTO lessons 
            (course_id, title, content, video_id, video_link, library_id, order_index) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            id ?? null,
            title ?? null,
            content ?? null,
            videoId ?? null,
            videoLink ?? null,
            libraryId ?? null,
            orderIndex ?? 0
        ]);
        return res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                videoId,
                videoLink,
                libraryId
            },
            message: "Lesson created successfully"
        });
    }
    catch (err) {
        console.error("Database Error in adminCreateLesson:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.adminCreateLesson = adminCreateLesson;
const adminDeleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        await (0, Courses_1.deleteCourse)(Number(id));
        return res.status(200).json({ success: true, message: "Course deleted successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminDeleteCourse = adminDeleteCourse;
const adminDeleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        await (0, Courses_1.deleteLesson)(Number(id));
        return res.status(200).json({ success: true, message: "Lesson deleted successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminDeleteLesson = adminDeleteLesson;
const adminGetStats = async (req, res) => {
    try {
        const stats = await (0, Users_1.getUserStats)();
        return res.status(200).json({ success: true, data: stats, message: "Statistics fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminGetStats = adminGetStats;
const adminCreateCategory = async (req, res) => {
    try {
        const { name, tag } = req.body;
        const categoryId = await (0, Categories_1.createCategory)(name, tag);
        return res.status(201).json({ success: true, data: { id: categoryId }, message: "Category created" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminCreateCategory = adminCreateCategory;
const adminGetActivityLogs = async (req, res) => {
    try {
        const { limit, offset } = req.query;
        const logs = await (0, ActivityLogs_1.getLogs)(limit ? Number(limit) : 50, offset ? Number(offset) : 0);
        return res.status(200).json({ success: true, data: logs, message: "Activity logs fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminGetActivityLogs = adminGetActivityLogs;
const adminGetPendingExams = async (req, res) => {
    try {
        const [rows] = await db_1.default.execute(`SELECT es.*, u.username, u.email, e.course_id 
             FROM exam_submissions es
             JOIN users u ON es.user_id = u.id
             JOIN exams e ON es.exam_id = e.id
             WHERE es.status = 'pending'`);
        return res.status(200).json({ success: true, data: rows, message: "Pending exams fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminGetPendingExams = adminGetPendingExams;
const adminGradeSubmission = async (req, res) => {
    try {
        const { id } = req.params; // submissionId
        const { theoryScore } = req.body;
        const [submissionRows] = await db_1.default.execute('SELECT objective_score FROM exam_submissions WHERE id = ?', [id]);
        if (submissionRows.length === 0) {
            return res.status(404).json({ success: false, message: "Submission not found" });
        }
        const totalScore = submissionRows[0].objective_score + Number(theoryScore);
        await db_1.default.execute('UPDATE exam_submissions SET theory_score = ?, total_score = ?, status = "graded" WHERE id = ?', [theoryScore, totalScore, id]);
        return res.status(200).json({ success: true, message: "Submission graded successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminGradeSubmission = adminGradeSubmission;
const adminApproveSubmission = async (req, res) => {
    try {
        const { id } = req.params; // submissionId
        const [rows] = await db_1.default.execute(`SELECT es.*, e.course_id, e.pass_percentage, u.email 
             FROM exam_submissions es
             JOIN exams e ON es.exam_id = e.id
             JOIN users u ON es.user_id = u.id
             WHERE es.id = ?`, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Submission not found" });
        }
        const submission = rows[0];
        if (submission.status !== 'graded') {
            return res.status(400).json({ success: false, message: "Submission must be graded before approval" });
        }
        // Generate certificate
        const certUuid = await (0, Exams_1.createCertificate)(submission.user_id, submission.course_id);
        // Update status
        await db_1.default.execute('UPDATE exam_submissions SET status = "approved" WHERE id = ?', [id]);
        // Send email via Resend
        await (0, email_1.sendCertificateEmail)(submission.email, certUuid);
        console.log(`Certificate generated: ${certUuid}. Email sent to ${submission.email}`);
        return res.status(200).json({ success: true, data: { certificateUuid: certUuid }, message: "Submission approved and certificate generated." });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminApproveSubmission = adminApproveSubmission;
// Exam CRUD
const adminGetCourseExam = async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await (0, Exams_1.getExamByCourseId)(Number(id));
        if (!exam) {
            return res.status(404).json({ success: false, data: null, message: "Exam not found for this course" });
        }
        const questions = await (0, Exams_1.getQuestionsByExamId)(exam.id);
        return res.status(200).json({ success: true, data: { exam, questions: questions }, message: "Exam fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.adminGetCourseExam = adminGetCourseExam;
const adminCreateExam = async (req, res) => {
    try {
        const { id } = req.params; // courseId
        const { passPercentage, title, duration } = req.body;
        const examId = await (0, Exams_1.createExam)(Number(id), passPercentage, title, duration);
        return res.status(201).json({ success: true, data: { id: examId }, message: "Exam created" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminCreateExam = adminCreateExam;
const adminUpdateExam = async (req, res) => {
    try {
        const { id } = req.params; // examId
        const { passPercentage, title, duration } = req.body;
        await (0, Exams_1.updateExam)(Number(id), passPercentage, title, duration);
        return res.status(200).json({ success: true, message: "Exam updated" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminUpdateExam = adminUpdateExam;
const adminDeleteExam = async (req, res) => {
    try {
        const { id } = req.params; // examId
        await (0, Exams_1.deleteExam)(Number(id));
        return res.status(200).json({ success: true, message: "Exam deleted" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminDeleteExam = adminDeleteExam;
// Question CRUD
const adminAddQuestion = async (req, res) => {
    try {
        const { id } = req.params; // examId
        const questionId = await (0, Exams_1.addQuestion)(Number(id), req.body);
        return res.status(201).json({ success: true, data: { id: questionId }, message: "Question added" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminAddQuestion = adminAddQuestion;
const adminUpdateQuestion = async (req, res) => {
    try {
        const { id } = req.params; // questionId
        await (0, Exams_1.updateQuestion)(Number(id), req.body);
        return res.status(200).json({ success: true, message: "Question updated" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminUpdateQuestion = adminUpdateQuestion;
const adminDeleteQuestion = async (req, res) => {
    try {
        const { id } = req.params; // questionId
        await (0, Exams_1.deleteQuestion)(Number(id));
        return res.status(200).json({ success: true, message: "Question deleted" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminDeleteQuestion = adminDeleteQuestion;
const adminListCourses = async (req, res) => {
    try {
        const courses = await (0, Courses_1.getAllCourses)(false); // All courses
        return res.status(200).json({ success: true, data: courses, message: "All courses fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: `Internal server error ${err}` });
    }
};
exports.adminListCourses = adminListCourses;
const adminToggleCourseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }
        await (0, Courses_1.setCourseStatus)(Number(id), status);
        return res.status(200).json({ success: true, message: `Course status updated to ${status}` });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: `Internal server error ${err}` });
    }
};
exports.adminToggleCourseStatus = adminToggleCourseStatus;
const adminUpdateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        // Support for dynamic lesson updates
        await (0, Courses_1.updateLesson)(Number(id), updateData);
        return res.status(200).json({ success: true, message: "Lesson updated successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminUpdateLesson = adminUpdateLesson;
const adminGetCourseLessons = async (req, res) => {
    try {
        const { id } = req.params;
        const lessons = await (0, Courses_1.getLessonsByCourseId)(Number(id));
        return res.status(200).json({ success: true, data: lessons, message: "Course lessons fetched for admin" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminGetCourseLessons = adminGetCourseLessons;
//# sourceMappingURL=Admin.js.map
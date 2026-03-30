"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetCourseLessons = exports.adminUpdateLesson = exports.adminToggleCourseStatus = exports.adminListCourses = exports.adminDeleteQuestion = exports.adminUpdateQuestion = exports.adminAddQuestion = exports.adminDeleteExam = exports.adminUpdateExam = exports.adminCreateExam = exports.adminGetCourseExam = exports.adminFinalizeSubmission = exports.adminGetPendingExams = exports.adminGetActivityLogs = exports.adminCreateCategory = exports.adminGetStats = exports.adminDeleteLesson = exports.adminDeleteCourse = exports.adminCreateLesson = exports.adminUpdateCourse = exports.adminCreateCourse = exports.adminUpdateUser = exports.adminToggleUserStatus = exports.adminGetUsers = void 0;
const db_1 = __importDefault(require("../db"));
const Users_1 = require("../models/Users");
const Exams_1 = require("../models/Exams");
const Courses_1 = require("../models/Courses");
const Categories_1 = require("../models/Categories");
const ActivityLogs_1 = require("../models/ActivityLogs");
const email_1 = require("../helpers/email");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const helpers_1 = require("../helpers");
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
const adminUpdateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId)
            return res.status(400).json({ message: "User id required" });
        const { role, password } = req.body;
        const user = await (0, Users_1.getUserById)(Number(userId));
        if (!user) {
            return res.status(404).json({ message: "User doesn't exist" });
        }
        const updateValues = {};
        if (role)
            updateValues.role = role;
        if (password) {
            const salt = (0, helpers_1.random)();
            updateValues.salt = salt;
            updateValues.password = (0, helpers_1.authentication)(salt, password);
        }
        if (Object.keys(updateValues).length === 0) {
            return res.status(400).json({ message: "No changes detected" });
        }
        await (0, Users_1.updateUserById)(Number(userId), updateValues);
        const safeResponse = {
            id: userId,
            role: role || user.role,
        };
        return res.status(200).json({
            success: true,
            data: safeResponse,
            message: "Profile updated successfully"
        });
    }
    catch (err) {
        console.error("Update User Error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminUpdateUser = adminUpdateUser;
const adminCreateCourse = async (req, res) => {
    try {
        const { title, description, price, video_link } = req.body;
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
        const [result] = await db_1.default.execute('INSERT INTO courses (title, description, price, video_link, cover_image) VALUES (?, ?, ?, ?, ?)', [title, description, price, video_link, coverImagePath]);
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
        const [rows] = await db_1.default.execute(`SELECT 
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
             WHERE es.STATUS = 'pending' AND q.TYPE = 'theory'`);
        return res.status(200).json({ success: true, data: rows, message: "Pending exams fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminGetPendingExams = adminGetPendingExams;
const adminFinalizeSubmission = async (req, res) => {
    try {
        const { id } = req.params; // submissionId
        const { theoryScore } = req.body;
        if (theoryScore === undefined)
            return res.status(400).json({ message: "Theory score is required" });
        const [rows] = await db_1.default.execute(`SELECT es.objective_score, e.course_id, e.pass_percentage, u.id AS user_id, u.email 
             FROM exam_submissions es
             JOIN exams e ON es.exam_id = e.id
             JOIN users u ON es.user_id = u.id
             WHERE es.id = ?`, [id]);
        if (rows.length === 0)
            return res.status(404).json({ success: false, message: "Submission not found" });
        const { objective_score, pass_percentage, user_id, course_id, email } = rows[0];
        const totalScore = Number(objective_score) + Number(theoryScore);
        const passed = totalScore >= (pass_percentage || 50);
        const finalStatus = passed ? "approved" : "failed";
        await db_1.default.execute('UPDATE exam_submissions SET theory_score = ?, total_score = ?, status = ?, passed = ? WHERE id = ?', [theoryScore, totalScore, finalStatus, passed ? 1 : 0, id]);
        let certUuid = null;
        if (passed) {
            certUuid = await (0, Exams_1.createCertificate)(user_id, course_id);
            await (0, email_1.sendCertificateEmail)(email, certUuid);
            console.log(`Certificate ${certUuid} sent to ${email}`);
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
    }
    catch (err) {
        console.error("Finalize Error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminFinalizeSubmission = adminFinalizeSubmission;
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
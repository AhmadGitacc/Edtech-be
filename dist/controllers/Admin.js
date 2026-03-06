"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDeleteQuestion = exports.adminUpdateQuestion = exports.adminAddQuestion = exports.adminDeleteExam = exports.adminUpdateExam = exports.adminCreateExam = exports.adminApproveSubmission = exports.adminGradeSubmission = exports.adminGetPendingExams = exports.adminCreateLesson = exports.adminCreateCourse = exports.adminGetUsers = void 0;
const db_1 = __importDefault(require("../db"));
const Users_1 = require("../models/Users");
const bunny_1 = require("../helpers/bunny");
const Exams_1 = require("../models/Exams");
const email_1 = require("../helpers/email");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const adminGetUsers = async (req, res) => {
    try {
        const users = await (0, Users_1.getUsers)();
        return res.status(200).json({ success: true, data: users, message: "Users fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminGetUsers = adminGetUsers;
const adminCreateCourse = async (req, res) => {
    try {
        const { title, description, price } = req.body;
        let coverImagePath = null;
        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const uploadsDir = path_1.default.join(__dirname, '../../uploads');
            // Ensure directory exists
            if (!fs_1.default.existsSync(uploadsDir)) {
                fs_1.default.mkdirSync(uploadsDir, { recursive: true });
            }
            const uploadPath = path_1.default.join(uploadsDir, fileName);
            fs_1.default.writeFileSync(uploadPath, req.file.buffer);
            coverImagePath = `/uploads/${fileName}`;
        }
        const [result] = await db_1.default.execute('INSERT INTO courses (title, description, price, cover_image) VALUES (?, ?, ?, ?)', [title, description, price, coverImagePath]);
        return res.status(201).json({ success: true, data: { id: result.insertId, coverImage: coverImagePath }, message: "Course created" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminCreateCourse = adminCreateCourse;
const adminCreateLesson = async (req, res) => {
    try {
        const { id } = req.params; // courseId
        const { title, content, orderIndex, videoLink } = req.body;
        let { videoId, libraryId } = req.body;
        if (req.file) {
            console.log(`Uploading video file: ${req.file.originalname}`);
            videoId = await (0, bunny_1.uploadVideoToBunny)(req.file.buffer, req.file.originalname);
            libraryId = process.env.BUNNY_LIBRARY_ID;
            console.log(`Video uploaded successfully. ID: ${videoId}`);
        }
        // if (!videoId || !libraryId) {
        //     return res.status(400).json({ success: false, message: "Video ID and Library ID are required (or upload a video file)" });
        // }
        const [result] = await db_1.default.execute('INSERT INTO lessons (course_id, title, content, video_id, video_link, library_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, title, content, videoId, videoLink, libraryId, orderIndex]);
        return res.status(201).json({ success: true, data: { id: result.insertId, videoId, videoLink, libraryId }, message: "Lesson created" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.adminCreateLesson = adminCreateLesson;
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
const adminCreateExam = async (req, res) => {
    try {
        const { id } = req.params; // courseId
        const { passPercentage } = req.body;
        const examId = await (0, Exams_1.createExam)(Number(id), passPercentage);
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
        const { passPercentage } = req.body;
        await (0, Exams_1.updateExam)(Number(id), passPercentage);
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
//# sourceMappingURL=Admin.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificate = exports.createCertificate = exports.getSubmissionById = exports.saveAnswer = exports.createSubmission = exports.deleteQuestion = exports.updateQuestion = exports.addQuestion = exports.deleteExam = exports.updateExam = exports.createExam = exports.getQuestionsByExamId = exports.getExamByCourseId = void 0;
const db_1 = __importDefault(require("../db"));
const uuid_1 = require("uuid");
const getExamByCourseId = async (courseId) => {
    const [rows] = await db_1.default.execute('SELECT * FROM exams WHERE course_id = ?', [courseId]);
    return rows[0] || null;
};
exports.getExamByCourseId = getExamByCourseId;
const getQuestionsByExamId = async (examId) => {
    const [rows] = await db_1.default.execute('SELECT * FROM exam_questions WHERE exam_id = ?', [examId]);
    return rows;
};
exports.getQuestionsByExamId = getQuestionsByExamId;
const createExam = async (courseId, passPercentage, title, duration) => {
    const [result] = await db_1.default.execute('INSERT INTO exams (course_id, pass_percentage, title, duration) VALUES (?, ?, ?, ?)', [
        courseId ?? null,
        passPercentage ?? 70,
        title ?? "Final Assessment",
        duration ?? 30
    ]);
    return result.insertId;
};
exports.createExam = createExam;
const updateExam = async (examId, passPercentage, title, duration) => {
    await db_1.default.execute('UPDATE exams SET pass_percentage = ?, title = ?, duration = ? WHERE id = ?', [passPercentage, title ?? "Final Assessment", duration ?? 30, examId]);
};
exports.updateExam = updateExam;
const deleteExam = async (examId) => {
    await db_1.default.execute('DELETE FROM exams WHERE id = ?', [examId]);
};
exports.deleteExam = deleteExam;
const addQuestion = async (examId, data) => {
    const { type = 'objective', question_text = '', OPTIONS, correct_option = 0 } = data;
    const finalOptions = OPTIONS || [];
    const [result] = await db_1.default.execute('INSERT INTO exam_questions (exam_id, type, question_text, options, correct_option) VALUES (?, ?, ?, ?, ?)', [
        examId,
        type,
        question_text,
        typeof finalOptions === 'string' ? finalOptions : JSON.stringify(finalOptions),
        correct_option ?? 0
    ]);
    return result.insertId;
};
exports.addQuestion = addQuestion;
const updateQuestion = async (questionId, data) => {
    const { type, question_text, options, correct_option } = data;
    await db_1.default.execute('UPDATE exam_questions SET type = ?, question_text = ?, options = ?, correct_option = ? WHERE id = ?', [type, question_text, JSON.stringify(options), correct_option, questionId]);
};
exports.updateQuestion = updateQuestion;
const deleteQuestion = async (questionId) => {
    await db_1.default.execute('DELETE FROM exam_questions WHERE id = ?', [questionId]);
};
exports.deleteQuestion = deleteQuestion;
const createSubmission = async (userId, examId, objectiveScore) => {
    const [result] = await db_1.default.execute('INSERT INTO exam_submissions (user_id, exam_id, objective_score, status) VALUES (?, ?, ?, "pending")', [userId, examId, objectiveScore]);
    return result.insertId;
};
exports.createSubmission = createSubmission;
const saveAnswer = async (submissionId, questionId, data) => {
    await db_1.default.execute('INSERT INTO exam_answers (submission_id, question_id, selected_option, theory_answer, score) VALUES (?, ?, ?, ?, ?)', [submissionId, questionId, data.selected_option ?? null, data.theory_answer ?? null, data.score]);
};
exports.saveAnswer = saveAnswer;
const getSubmissionById = async (submissionId) => {
    const [rows] = await db_1.default.execute('SELECT * FROM exam_submissions WHERE id = ?', [submissionId]);
    return rows[0] || null;
};
exports.getSubmissionById = getSubmissionById;
const createCertificate = async (userId, courseId) => {
    const certificateUuid = (0, uuid_1.v4)();
    await db_1.default.execute('INSERT INTO certificates (user_id, course_id, certificate_uuid) VALUES (?, ?, ?)', [userId, courseId, certificateUuid]);
    return certificateUuid;
};
exports.createCertificate = createCertificate;
const getCertificate = async (userId, courseId) => {
    const [rows] = await db_1.default.execute('SELECT * FROM certificates WHERE user_id = ? AND course_id = ?', [userId, courseId]);
    return rows[0] || null;
};
exports.getCertificate = getCertificate;
//# sourceMappingURL=Exams.js.map
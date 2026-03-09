"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserExamHistory = exports.submitExam = exports.getCourseExam = void 0;
const db_1 = __importDefault(require("../db"));
const Exams_1 = require("../models/Exams");
const getCourseExam = async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await (0, Exams_1.getExamByCourseId)(Number(id));
        if (!exam) {
            return res.status(404).json({ success: false, data: null, message: "Exam not found for this course" });
        }
        const questions = await (0, Exams_1.getQuestionsByExamId)(exam.id);
        const questionsWithoutAnswers = questions.map(q => {
            const { correct_option, ...rest } = q;
            return rest;
        });
        return res.status(200).json({ success: true, data: { exam, questions: questionsWithoutAnswers }, message: "Exam fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.getCourseExam = getCourseExam;
const submitExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body; // Array of { questionId, selectedOption, theoryAnswer }
        const userId = req.user?.id;
        if (!userId)
            return res.sendStatus(401);
        const exam = await (0, Exams_1.getExamByCourseId)(Number(id));
        if (!exam)
            return res.status(404).json({ success: false, message: "Exam not found" });
        const questions = await (0, Exams_1.getQuestionsByExamId)(exam.id);
        let objectiveScore = 0;
        // 1. Create submission record
        const submissionId = await (0, Exams_1.createSubmission)(userId, exam.id, 0); // Temporary score
        // 2. Process answers
        for (const q of questions) {
            const userAnswer = answers.find((a) => a.questionId === q.id);
            let score = 0;
            let theoryAnswer = null;
            let selectedOption = null;
            if (q.type === 'objective') {
                selectedOption = userAnswer?.selectedOption;
                if (selectedOption === q.correct_option) {
                    score = 1;
                    objectiveScore++;
                }
            }
            else if (q.type === 'theory') {
                theoryAnswer = userAnswer?.theoryAnswer;
                score = 0; // To be marked by admin
            }
            await (0, Exams_1.saveAnswer)(submissionId, q.id, { selectedOption, theoryAnswer, score });
        }
        // 3. Update objective score in submission
        await db_1.default.execute('UPDATE exam_submissions SET objective_score = ? WHERE id = ?', [objectiveScore, submissionId]);
        return res.status(200).json({
            success: true,
            data: { submissionId, objectiveScore, status: 'pending' },
            message: "Exam submitted successfully. Theory questions are pending grading."
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.submitExam = submitExam;
const getUserExamHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.sendStatus(401);
        const [rows] = await db_1.default.execute(`SELECT es.*, e.title as exam_title, c.title as course_title 
             FROM exam_submissions es
             JOIN exams e ON es.exam_id = e.id
             JOIN courses c ON e.course_id = c.id
             WHERE es.user_id = ?
             ORDER BY es.created_at DESC`, [userId]);
        return res.status(200).json({ success: true, data: rows, message: "Exam history fetched" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getUserExamHistory = getUserExamHistory;
//# sourceMappingURL=Exams.js.map
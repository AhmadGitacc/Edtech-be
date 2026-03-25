import express from "express";
import pool from "../db";
import { getExamByCourseId, getQuestionsByExamId, createSubmission, saveAnswer } from "../models/Exams";
import { RowDataPacket } from "mysql2";
import { AuthRequest } from "../middlewares/auth";

export const getCourseExam = async (req: AuthRequest, res: express.Response) => {
    try {
        const { id } = req.params;
        const exam = await getExamByCourseId(Number(id));
        if (!exam) {
            return res.status(404).json({ success: false, data: null, message: "Exam not found for this course" });
        }
        const questions = await getQuestionsByExamId(exam.id);
        const questionsWithoutAnswers = questions.map(q => {
            const { correct_option, ...rest } = q;
            return rest;
        });

        return res.status(200).json({ success: true, data: { exam, questions: questionsWithoutAnswers }, message: "Exam fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const submitExam = async (req: AuthRequest, res: express.Response) => {
    try {
        const { id } = req.params;
        const { answers } = req.body;
        const userId = req.user?.id;
        if (!userId) return res.sendStatus(401);

        const exam = await getExamByCourseId(Number(id));
        if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

        const questions = await getQuestionsByExamId(exam.id);
        let objectiveScore = 0;

        const submissionId = await createSubmission(userId, exam.id, 0); // Temporary score

        for (const q of questions) {
            const userAnswer = answers.find((a: any) => Number(a.questionId) === Number(q.id));
            let score = 0;
            let theory_answer = null;
            let selected_option = null;
            
            if (userAnswer) {
                theory_answer = userAnswer.theory_answer;
                selected_option = userAnswer.selected_option;
                
                if (q.TYPE === 'objective'&& selected_option !== null) {
                    if (Number(selected_option) === Number(q.correct_option)) {
                        score = 1;
                        objectiveScore++;
                    }
                } else if (q.TYPE === 'theory'&& theory_answer !== null) {
                    score = 0; // To be marked by admin
                }
                
            }
            await saveAnswer(submissionId, q.id, { selected_option, theory_answer, score });
        }

        await pool.execute('UPDATE exam_submissions SET objective_score = ? WHERE id = ?', [objectiveScore, submissionId]);

        return res.status(200).json({
            success: true,
            data: { submissionId, objectiveScore, status: 'pending' },
            message: "Exam submitted successfully. Theory questions are pending grading."
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const getUserExamHistory = async (req: AuthRequest, res: express.Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.sendStatus(401);

        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT es.*, e.title as exam_title, c.title as course_title 
             FROM exam_submissions es
             JOIN exams e ON es.exam_id = e.id
             JOIN courses c ON e.course_id = c.id
             WHERE es.user_id = ?
             ORDER BY es.created_at DESC`,
            [userId]
        );

        return res.status(200).json({ success: true, data: rows, message: "Exam history fetched" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

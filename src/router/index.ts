import express from 'express';
import multer from 'multer';

import { login, signup } from '../controllers/Auth';
import { listCourses, getCourseDetails, getLessonDetails, completeLesson, getMyCourses } from '../controllers/Courses';
import { getCourseExam, submitExam } from '../controllers/Exams';
import { initializePayment, paystackWebhook } from '../controllers/Payments';
import { adminGetUsers, adminCreateCourse, adminCreateLesson, adminGetPendingExams, adminGradeSubmission, adminApproveSubmission, adminCreateExam, adminUpdateExam, adminDeleteExam, adminAddQuestion, adminUpdateQuestion, adminDeleteQuestion } from '../controllers/Admin';
import { isAuthenticated, isAdmin } from '../middlewares/auth';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


export default (): express.Router => {
    // Auth
    router.post('/auth/register', signup);
    router.post('/auth/login', login);

    // Courses & Lessons
    router.get('/courses', listCourses);
    router.get('/courses/:id', getCourseDetails);
    router.get('/lessons/:id', isAuthenticated, getLessonDetails);
    router.post('/lessons/:id/complete', isAuthenticated, completeLesson);
    router.get('/my-courses', isAuthenticated, getMyCourses);

    // Exams & Certificates
    router.get('/courses/:id/exam', isAuthenticated, getCourseExam);
    router.post('/courses/:id/exam/submit', isAuthenticated, submitExam);

    // Payments
    router.post('/payments/initialize', isAuthenticated, initializePayment);
    router.post('/payments/webhook', express.raw({ type: 'application/json' }), paystackWebhook);

    // Admin
    router.get('/admin/users', isAuthenticated, isAdmin, adminGetUsers);
    router.post('/admin/courses', isAuthenticated, isAdmin, upload.single('coverImage'), adminCreateCourse);
    router.post('/admin/courses/:id/lessons', isAuthenticated, isAdmin, adminCreateLesson);
    // router.post('/admin/courses/:id/lessons', isAuthenticated, isAdmin, upload.single('video'), adminCreateLesson);

    // Exam Management
    router.get('/admin/exams/pending', isAuthenticated, isAdmin, adminGetPendingExams);
    router.patch('/admin/submissions/:id/grade', isAuthenticated, isAdmin, adminGradeSubmission);
    router.post('/admin/submissions/:id/approve', isAuthenticated, isAdmin, adminApproveSubmission);

    // Exam CRUD
    router.post('/admin/courses/:id/exam', isAuthenticated, isAdmin, adminCreateExam);
    router.patch('/admin/exams/:id', isAuthenticated, isAdmin, adminUpdateExam);
    router.delete('/admin/exams/:id', isAuthenticated, isAdmin, adminDeleteExam);

    // Question CRUD
    router.post('/admin/exams/:id/questions', isAuthenticated, isAdmin, adminAddQuestion);
    router.patch('/admin/questions/:id', isAuthenticated, isAdmin, adminUpdateQuestion);
    router.delete('/admin/questions/:id', isAuthenticated, isAdmin, adminDeleteQuestion);


    return router;
};
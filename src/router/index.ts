import express from 'express';
import multer from 'multer';

import { login, signup, logout } from '../controllers/Auth';
import { listCourses, getCourseDetails, getLessonDetails, completeLesson, getMyCourses, listCategories, getCourseLessons } from '../controllers/Courses';
import { getCourseExam, submitExam, getUserExamHistory } from '../controllers/Exams';
import { initializePayment, paystackWebhook } from '../controllers/Payments';
import { adminGetUsers, adminCreateCourse, adminCreateLesson, adminGetPendingExams, adminGradeSubmission, adminApproveSubmission, adminCreateExam, adminUpdateExam, adminDeleteExam, adminAddQuestion, adminUpdateQuestion, adminDeleteQuestion, adminDeleteCourse, adminDeleteLesson, adminGetStats, adminToggleUserStatus, adminCreateCategory, adminGetActivityLogs, adminListCourses, adminToggleCourseStatus, adminUpdateCourse, adminUpdateLesson, adminGetCourseLessons, adminGetCourseExam } from '../controllers/Admin';
import { isAuthenticated, isAdmin } from '../middlewares/auth';
import { sendEnquiryMessage } from 'controllers/Email';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


export default (): express.Router => {
    router.post('/send-enquiry', sendEnquiryMessage);

    // Auth
    router.post('/auth/register', signup);
    router.post('/auth/login', login);
    router.post('/auth/logout', isAuthenticated, logout);

    // Categories
    router.get('/categories', listCategories);

    // Courses & Lessons
    router.get('/courses', listCourses);
    router.get('/courses/:id', getCourseDetails);
    router.get('/courses/:id/lessons', getCourseLessons);
    router.get('/lessons/:id', isAuthenticated, getLessonDetails);
    router.post('/lessons/:id/complete', isAuthenticated, completeLesson);
    router.get('/my-courses', isAuthenticated, getMyCourses);

    // Exams & Certificates
    router.get('/courses/:id/exam', isAuthenticated, getCourseExam);
    router.post('/courses/:id/exam/submit', isAuthenticated, submitExam);
    router.get('/user/exams/history', isAuthenticated, getUserExamHistory);

    // Payments
    router.post('/payments/initialize', isAuthenticated, initializePayment);
    router.post('/payments/webhook', express.raw({ type: 'application/json' }), paystackWebhook);

    // Admin
    router.get('/admin/users', isAuthenticated, isAdmin, adminGetUsers);
    router.patch('/admin/users/:id/status', isAuthenticated, isAdmin, adminToggleUserStatus);
    router.post('/admin/courses', isAuthenticated, isAdmin, upload.single('coverImage'), adminCreateCourse);
    router.patch('/admin/courses/:id', isAuthenticated, isAdmin, upload.single('coverImage'), adminUpdateCourse);
    router.get('/admin/courses', isAuthenticated, isAdmin, adminListCourses);
    router.get('/admin/courses/:id/lessons', isAuthenticated, isAdmin, adminGetCourseLessons);
    router.delete('/admin/courses/:id', isAuthenticated, isAdmin, adminDeleteCourse);
    router.patch('/admin/courses/:id/status', isAuthenticated, isAdmin, adminToggleCourseStatus);
    router.post('/admin/courses/:id/lessons', isAuthenticated, isAdmin, upload.none(), adminCreateLesson);
    router.patch('/admin/lessons/:id', isAuthenticated, isAdmin, upload.none(), adminUpdateLesson);
    router.delete('/admin/lessons/:id', isAuthenticated, isAdmin, adminDeleteLesson);
    router.get('/admin/stats', isAuthenticated, isAdmin, adminGetStats);
    router.post('/admin/categories', isAuthenticated, isAdmin, adminCreateCategory);
    router.get('/admin/activity-logs', isAuthenticated, isAdmin, adminGetActivityLogs);

    // Exam Management
    router.get('/admin/exams/pending', isAuthenticated, isAdmin, adminGetPendingExams);
    router.patch('/admin/submissions/:id/grade', isAuthenticated, isAdmin, adminGradeSubmission);
    router.post('/admin/submissions/:id/approve', isAuthenticated, isAdmin, adminApproveSubmission);

    // Exam CRUD
    router.get('/admin/courses/:id/exam', isAuthenticated, isAdmin, adminGetCourseExam);
    router.post('/admin/courses/:id/exam', isAuthenticated, isAdmin, adminCreateExam);
    router.patch('/admin/exams/:id', isAuthenticated, isAdmin, adminUpdateExam);
    router.delete('/admin/exams/:id', isAuthenticated, isAdmin, adminDeleteExam);
    
    // Question CRUD
    router.post('/admin/exams/:id/questions', isAuthenticated, isAdmin, adminAddQuestion);
    router.patch('/admin/questions/:id', isAuthenticated, isAdmin, adminUpdateQuestion);
    router.delete('/admin/questions/:id', isAuthenticated, isAdmin, adminDeleteQuestion);


    return router;
};
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Auth_1 = require("../controllers/Auth");
const Courses_1 = require("../controllers/Courses");
const Exams_1 = require("../controllers/Exams");
const Payments_1 = require("../controllers/Payments");
const Admin_1 = require("../controllers/Admin");
const auth_1 = require("../middlewares/auth");
const Email_1 = require("../controllers/Email");
const multer_1 = require("../middlewares/multer");
const Users_1 = require("../controllers/Users");
const router = express_1.default.Router();
exports.default = () => {
    router.post('/send-enquiry', Email_1.sendEnquiryMessage);
    // Auth
    router.post('/auth/register', Auth_1.signup);
    router.post('/auth/login', Auth_1.login);
    router.post('/auth/logout', auth_1.isAuthenticated, Auth_1.logout);
    router.post('/auth/update', auth_1.isAuthenticated, Users_1.updateUser);
    // Categories
    router.get('/categories', Courses_1.listCategories);
    // Courses & Lessons
    router.get('/courses', Courses_1.listCourses);
    router.get('/courses/:id', Courses_1.getCourseDetails);
    router.get('/courses/:id/lessons', Courses_1.getCourseLessons);
    router.get('/courses/:id/progress', auth_1.isAuthenticated, Courses_1.getProgress);
    router.get('/lessons/:id', auth_1.isAuthenticated, Courses_1.getLessonDetails);
    router.post('/lessons/:id/complete', auth_1.isAuthenticated, Courses_1.completeLesson);
    router.get('/my-courses', auth_1.isAuthenticated, Courses_1.getMyCourses);
    // Exams & Certificates
    router.get('/courses/:id/exam', auth_1.isAuthenticated, Exams_1.getCourseExam);
    router.post('/courses/:id/exam/submit', auth_1.isAuthenticated, Exams_1.submitExam);
    router.get('/user/exams/history', auth_1.isAuthenticated, Exams_1.getUserExamHistory);
    // Payments
    router.post('/payments/initialize', auth_1.isAuthenticated, Payments_1.initializePayment);
    router.post('/payments/webhook', express_1.default.raw({ type: 'application/json' }), Payments_1.paystackWebhook);
    // Admin
    router.get('/admin/users', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminGetUsers);
    router.patch('/admin/users/:id/status', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminToggleUserStatus);
    router.patch('/admin/user/update/:id', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminUpdateUser);
    router.post('/admin/courses', auth_1.isAuthenticated, auth_1.isAdmin, multer_1.upload.single('cover_image'), Admin_1.adminCreateCourse);
    router.patch('/admin/courses/:id', auth_1.isAuthenticated, auth_1.isAdmin, multer_1.upload.single('cover_image'), Admin_1.adminUpdateCourse);
    router.get('/admin/courses', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminListCourses);
    router.get('/admin/courses/:id/lessons', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminGetCourseLessons);
    router.delete('/admin/courses/:id', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminDeleteCourse);
    router.patch('/admin/courses/:id/status', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminToggleCourseStatus);
    router.post('/admin/courses/:id/lessons', auth_1.isAuthenticated, auth_1.isAdmin, multer_1.upload.none(), Admin_1.adminCreateLesson);
    router.patch('/admin/lessons/:id', auth_1.isAuthenticated, auth_1.isAdmin, multer_1.upload.none(), Admin_1.adminUpdateLesson);
    router.delete('/admin/lessons/:id', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminDeleteLesson);
    router.get('/admin/stats', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminGetStats);
    router.post('/admin/categories', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminCreateCategory);
    router.get('/admin/activity-logs', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminGetActivityLogs);
    // Exam Management
    router.get('/admin/exams/pending', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminGetPendingExams);
    router.patch('/admin/submissions/:id/grade', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminGradeSubmission);
    router.post('/admin/submissions/:id/approve', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminApproveSubmission);
    // Exam CRUD
    router.get('/admin/courses/:id/exam', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminGetCourseExam);
    router.post('/admin/courses/:id/exam', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminCreateExam);
    router.patch('/admin/exams/:id', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminUpdateExam);
    router.delete('/admin/exams/:id', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminDeleteExam);
    // Question CRUD
    router.post('/admin/exams/:id/questions', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminAddQuestion);
    router.patch('/admin/questions/:id', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminUpdateQuestion);
    router.delete('/admin/questions/:id', auth_1.isAuthenticated, auth_1.isAdmin, Admin_1.adminDeleteQuestion);
    return router;
};
//# sourceMappingURL=index.js.map
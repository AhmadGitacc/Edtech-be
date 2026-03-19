"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnrollmentsByUserId = exports.getEnrollmentByReference = exports.updateEnrollmentStatus = exports.createEnrollment = void 0;
const db_1 = __importDefault(require("../db"));
const createEnrollment = async (userId, courseId, reference) => {
    await db_1.default.execute('INSERT INTO enrollments (user_id, course_id, payment_reference, status) VALUES (?, ?, ?, "pending")', [userId, courseId, reference]);
};
exports.createEnrollment = createEnrollment;
const updateEnrollmentStatus = async (reference, status) => {
    await db_1.default.execute('UPDATE enrollments SET status = ? WHERE payment_reference = ?', [status, reference]);
};
exports.updateEnrollmentStatus = updateEnrollmentStatus;
const getEnrollmentByReference = async (reference) => {
    const [rows] = await db_1.default.execute('SELECT * FROM enrollments WHERE payment_reference = ?', [reference]);
    return rows[0] || null;
};
exports.getEnrollmentByReference = getEnrollmentByReference;
const getEnrollmentsByUserId = async (userId) => {
    const [rows] = await db_1.default.execute(`SELECT c.id, c.title, c.description, c.price,c.cover_image, e.payment_reference, e.created_at 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE e.user_id = ? AND e.status = 'success'`, [userId]);
    return rows;
};
exports.getEnrollmentsByUserId = getEnrollmentsByUserId;
//# sourceMappingURL=Payments.js.map
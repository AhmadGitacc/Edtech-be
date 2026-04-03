"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLesson = exports.setCourseStatus = exports.deleteLesson = exports.updateCourse = exports.deleteCourse = exports.getProgress = exports.trackProgress = exports.getLessonById = exports.getLessonsByCourseId = exports.getCourseById = exports.getAllCourses = void 0;
const db_1 = __importDefault(require("../db"));
const getAllCourses = async (filterActive = false) => {
    let query = `
    SELECT 
        *, 
        (SELECT COUNT(*) 
         FROM enrollments 
         WHERE enrollments.course_id = courses.id 
         AND LOWER(enrollments.STATUS) = 'success'
        ) AS enrollment_count 
    FROM courses`;
    if (filterActive) {
        query += " WHERE status = 'active'";
    }
    const [rows] = await db_1.default.execute(query);
    return rows;
};
exports.getAllCourses = getAllCourses;
const getCourseById = async (id) => {
    const [rows] = await db_1.default.execute('SELECT * FROM courses WHERE id = ?', [id]);
    return rows[0] || null;
};
exports.getCourseById = getCourseById;
const getLessonsByCourseId = async (courseId) => {
    const [rows] = await db_1.default.execute('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC', [courseId]);
    return rows;
};
exports.getLessonsByCourseId = getLessonsByCourseId;
const getLessonById = async (id) => {
    const [rows] = await db_1.default.execute('SELECT * FROM lessons WHERE id = ?', [id]);
    return rows[0] || null;
};
exports.getLessonById = getLessonById;
const trackProgress = async (userId, lessonId) => {
    await db_1.default.execute('INSERT INTO user_progress (user_id, lesson_id, completed) VALUES (?, ?, true) ON DUPLICATE KEY UPDATE completed = true', [userId, lessonId]);
};
exports.trackProgress = trackProgress;
const getProgress = async (userId, courseId) => {
    const [rows] = await db_1.default.execute('SELECT lesson_id FROM user_progress up JOIN lessons l ON up.lesson_id = l.id WHERE up.user_id = ? AND l.course_id = ? AND up.completed = true', [userId, courseId]);
    return rows.map(r => r.lesson_id);
};
exports.getProgress = getProgress;
const deleteCourse = async (id) => {
    await db_1.default.execute('DELETE FROM courses WHERE id = ?', [id]);
};
exports.deleteCourse = deleteCourse;
const updateCourse = async (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    if (fields.length === 0)
        return;
    await db_1.default.execute(`UPDATE courses SET ${fields} WHERE id = ?`, [...values, id]);
};
exports.updateCourse = updateCourse;
const deleteLesson = async (id) => {
    await db_1.default.execute('DELETE FROM lessons WHERE id = ?', [id]);
};
exports.deleteLesson = deleteLesson;
const setCourseStatus = async (id, status) => {
    await db_1.default.execute('UPDATE courses SET status = ? WHERE id = ?', [status, id]);
};
exports.setCourseStatus = setCourseStatus;
const updateLesson = async (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    if (fields.length === 0)
        return;
    await db_1.default.execute(`UPDATE lessons SET ${fields} WHERE id = ?`, [...values, id]);
};
exports.updateLesson = updateLesson;
//# sourceMappingURL=Courses.js.map
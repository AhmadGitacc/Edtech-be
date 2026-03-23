"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStats = exports.setUserStatus = exports.updateUserById = exports.deleteUserById = exports.getUsers = exports.getUserById = exports.getUserByEmail = exports.createUser = void 0;
const db_1 = __importDefault(require("../db"));
const createUser = async (username, email, passwordHash, salt) => {
    const [result] = await db_1.default.execute('INSERT INTO users (username, email, password, salt) VALUES (?, ?, ?, ?)', [username, email, passwordHash, salt]);
    return result.insertId;
};
exports.createUser = createUser;
const getUserByEmail = async (email) => {
    const [rows] = await db_1.default.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
};
exports.getUserByEmail = getUserByEmail;
const getUserById = async (id) => {
    const [rows] = await db_1.default.execute('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
};
exports.getUserById = getUserById;
const getUsers = async (search, limit = 40, offset = 0) => {
    let query = 'SELECT id, username, email, role, is_active, created_at FROM users';
    const params = [];
    if (search) {
        query += ' WHERE username LIKE ? OR email LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await db_1.default.execute(query, params);
    return rows;
};
exports.getUsers = getUsers;
const deleteUserById = async (id) => {
    await db_1.default.execute('DELETE FROM users WHERE id = ?', [id]);
};
exports.deleteUserById = deleteUserById;
const updateUserById = async (id, values) => {
    const keys = Object.keys(values);
    if (keys.length === 0)
        return;
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(values), id];
    await db_1.default.execute(`UPDATE users SET ${setClause} WHERE id = ?`, params);
};
exports.updateUserById = updateUserById;
const setUserStatus = async (id, isActive) => {
    await db_1.default.execute('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
};
exports.setUserStatus = setUserStatus;
const getUserStats = async () => {
    const [rows] = await db_1.default.execute(`
        SELECT 
            (SELECT COUNT(*) FROM users WHERE role = 'student') as totalStudents,
            (SELECT COUNT(*) FROM courses) as totalCourses,
            (SELECT SUM(price) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.status = 'success') as revenue,
            (SELECT COUNT(*) FROM enrollments WHERE status = 'success') as totalEnrollments,
            (SELECT COUNT(*) FROM exam_submissions WHERE status = 'pending') as pendingExams
    `);
    // Adding placeholder trends as it often requires time-series data
    return {
        ...rows[0],
        trends: {
            revenueGrowth: "+10%",
            studentGrowth: "+5%"
        }
    };
};
exports.getUserStats = getUserStats;
//# sourceMappingURL=Users.js.map
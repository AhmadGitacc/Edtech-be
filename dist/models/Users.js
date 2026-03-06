"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserById = exports.deleteUserById = exports.getUsers = exports.getUserById = exports.getUserByEmail = exports.createUser = void 0;
const db_1 = __importDefault(require("../db"));
const createUser = async (username, email, passwordHash) => {
    const [result] = await db_1.default.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, passwordHash]);
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
const getUsers = async () => {
    const [rows] = await db_1.default.execute('SELECT id, username, email, role, created_at FROM users');
    return rows;
};
exports.getUsers = getUsers;
const deleteUserById = async (id) => {
    await db_1.default.execute('DELETE FROM users WHERE id = ?', [id]);
};
exports.deleteUserById = deleteUserById;
const updateUserById = async (id, values) => {
    const setClause = Object.keys(values).map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(values), id];
    await db_1.default.execute(`UPDATE users SET ${setClause} WHERE id = ?`, params);
};
exports.updateUserById = updateUserById;
//# sourceMappingURL=Users.js.map
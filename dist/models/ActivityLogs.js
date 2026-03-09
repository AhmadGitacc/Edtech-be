"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogs = exports.createLog = void 0;
const db_1 = __importDefault(require("../db"));
const createLog = async (userId, action, details) => {
    const [result] = await db_1.default.execute('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [userId, action, details]);
    return result.insertId;
};
exports.createLog = createLog;
const getLogs = async (limit = 50, offset = 0) => {
    const [rows] = await db_1.default.execute('SELECT al.*, u.username FROM activity_logs al JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    return rows;
};
exports.getLogs = getLogs;
//# sourceMappingURL=ActivityLogs.js.map
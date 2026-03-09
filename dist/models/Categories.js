"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = exports.getAllCategories = void 0;
const db_1 = __importDefault(require("../db"));
const getAllCategories = async () => {
    const [rows] = await db_1.default.execute('SELECT * FROM categories');
    return rows;
};
exports.getAllCategories = getAllCategories;
const createCategory = async (name, tag) => {
    const [result] = await db_1.default.execute('INSERT INTO categories (name, category_tag) VALUES (?, ?)', [name, tag]);
    return result.insertId;
};
exports.createCategory = createCategory;
//# sourceMappingURL=Categories.js.map
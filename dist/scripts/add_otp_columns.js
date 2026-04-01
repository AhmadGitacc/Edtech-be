"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
async function addOtpColumns() {
    try {
        console.log('Adding reset_otp and reset_otp_expires_at columns to users table...');
        // Check if the columns already exist before adding
        try {
            await db_1.default.query('ALTER TABLE users ADD COLUMN reset_otp VARCHAR(6) NULL');
            console.log('Added reset_otp column.');
        }
        catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('reset_otp column already exists.');
            }
            else {
                throw e;
            }
        }
        try {
            await db_1.default.query('ALTER TABLE users ADD COLUMN reset_otp_expires_at DATETIME NULL');
            console.log('Added reset_otp_expires_at column.');
        }
        catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('reset_otp_expires_at column already exists.');
            }
            else {
                throw e;
            }
        }
        console.log('Migration completed successfully.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    }
}
addOtpColumns();
//# sourceMappingURL=add_otp_columns.js.map
import pool from '../db';

async function addOtpColumns() {
    try {
        console.log('Adding reset_otp and reset_otp_expires_at columns to users table...');
        
        // Check if the columns already exist before adding
        try {
            await pool.query('ALTER TABLE users ADD COLUMN reset_otp VARCHAR(6) NULL');
            console.log('Added reset_otp column.');
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('reset_otp column already exists.');
            } else {
                throw e;
            }
        }
        
        try {
            await pool.query('ALTER TABLE users ADD COLUMN reset_otp_expires_at DATETIME NULL');
            console.log('Added reset_otp_expires_at column.');
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('reset_otp_expires_at column already exists.');
            } else {
                throw e;
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    }
}

addOtpColumns();

import pool from '../db';

async function migrate() {
    try {
        console.log("Starting migration: Add cover_image to courses and video_link to lessons...");

        // 1. Add 'cover_image' column to courses
        console.log("Adding 'cover_image' column to courses...");
        // Check if column exists first to avoid error if run multiple times
        const [courseColumns] = await pool.execute("SHOW COLUMNS FROM courses LIKE 'cover_image'");
        if ((courseColumns as any[]).length === 0) {
            await pool.execute("ALTER TABLE courses ADD COLUMN cover_image VARCHAR(255) DEFAULT NULL AFTER description");
            console.log("'cover_image' column added.");
        } else {
            console.log("'cover_image' column already exists.");
        }

        // 2. Add 'video_link' column to lessons
        console.log("Adding 'video_link' column to lessons...");
        const [lessonColumns] = await pool.execute("SHOW COLUMNS FROM lessons LIKE 'video_link'");
        if ((lessonColumns as any[]).length === 0) {
            await pool.execute("ALTER TABLE lessons ADD COLUMN video_link VARCHAR(255) DEFAULT NULL AFTER video_id");
            console.log("'video_link' column added.");
        } else {
            console.log("'video_link' column already exists.");
        }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();

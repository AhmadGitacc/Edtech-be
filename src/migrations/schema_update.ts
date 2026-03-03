import pool from '../db';

async function migrate() {
    try {
        console.log("Starting migration...");

        // 1. Add 'type' column to exam_questions
        console.log("Adding 'type' column to exam_questions...");
        await pool.execute("ALTER TABLE exam_questions ADD COLUMN type ENUM('objective', 'theory') DEFAULT 'objective' AFTER exam_id");

        // 2. Create exam_submissions table
        console.log("Creating exam_submissions table...");
        await pool.execute(`
            CREATE TABLE exam_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                exam_id INT NOT NULL,
                objective_score INT DEFAULT 0,
                theory_score INT DEFAULT NULL,
                total_score INT DEFAULT NULL,
                status ENUM('pending', 'graded', 'approved') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (exam_id) REFERENCES exams(id)
            )
        `);

        // 3. Create exam_answers table
        console.log("Creating exam_answers table...");
        await pool.execute(`
            CREATE TABLE exam_answers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                submission_id INT NOT NULL,
                question_id INT NOT NULL,
                selected_option INT DEFAULT NULL,
                theory_answer TEXT DEFAULT NULL,
                score INT DEFAULT 0,
                FOREIGN KEY (submission_id) REFERENCES exam_submissions(id),
                FOREIGN KEY (question_id) REFERENCES exam_questions(id)
            )
        `);

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();

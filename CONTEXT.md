# Project Context: EdTech Platform (Node.js + MySQL)

## 🎯 Project Overview
A small-scale EdTech platform with student/admin roles, video lectures (Bunny.net), and automated certificate issuance.

## 🛠 Tech Stack
- **Backend:** Node.js (Express)
- **Database:** MySQL (using `mysql2/promise` for async/await)
- **Architecture:** MVC (Models, Views, Controllers)
- **Video:** Bunny.net Stream API
- **Payments:** Paystack API
- **Email:** Resend API
- **Authentication:** JWT + Bcrypt

## 📏 Coding Standards & Best Practices
- **No MongoDB:** Migration completed. MongoDB/Mongoose removed.
- **Async/Await:** Used for all DB operations.
- **Security:** JWT for sessions, Bcrypt for passwords, express-validator recommended for inputs.
- **SQL Safety:** Prepared Statements (`?` placeholders) used across all models.
- **Response Format:** All API responses follow: `{ "success": boolean, "data": null/object, "message": string }`.
- **Bunny.net:** Store Bunny.net `video_id` and `library_id` in the `lessons` table.

## 📂 Folder Structure
```
src/
├── controllers/    # Route handlers (Auth, Admin, Courses, Exams, Payments)
├── helpers/        # Utility functions (Legacy/Internal)
├── middlewares/    # Custom middlewares (Auth verification)
├── models/         # MySQL models (Users, Courses, Exams, Payments)
├── router/         # Express routes
├── db.ts           # MySQL connection pool
└── index.ts        # Server entry point
```

## 🗄️ MySQL Schema
- **users**: `id, username, email, password, role, is_active (BOOLEAN), created_at`
- **courses**: `id, title, description, price, category_tag (FK), status (active|inactive), created_at`
- **categories**: `id, name, category_tag (UNIQUE), created_at`
- **activity_logs**: `id, user_id, action, details, created_at`
- **lessons**: `id, course_id, title, content, video_id, library_id, order_index`
- **user_progress**: `user_id, lesson_id, completed` (Composite Key)
- **exams**: `id, course_id, pass_percentage, title, duration`
- **exam_questions**: `id, exam_id, type (objective/theory), question_text, options (JSON), correct_option`
- **exam_submissions**: `id, user_id, exam_id, objective_score, theory_score, total_score, status, created_at`
- **exam_answers**: `id, submission_id, question_id, selected_option, theory_answer, score`
- **certificates**: `id, user_id, course_id, certificate_uuid, created_at`
- **enrollments**: `id, user_id, course_id, payment_reference, status, created_at`

## 🚀 Completed Features
- [x] JWT + Bcrypt Authentication (Register/Login).
- [x] Course & Lesson listing and details.
- [x] Progress tracking for lessons.
- [x] Exam submission with Hybrid Grading (Objective + Theory).
- [x] Admin grading for theory questions.
- [x] Automated certificate generation and email delivery via Resend API.
- [x] Paystack Payment Initialization and Webhook handling.
- [x] Student: List paid courses (purchased successfully).
- [x] Admin: CRUD for Exams and Questions.
- [x] Course cover image upload and static serving.
- [x] Lesson video link support (external links).
- [x] Admin management for users, courses, and lessons with Bunny.net support.
- [x] Admin: Course/Lesson deletion and Category management.
- [x] Admin Dashboard Analytics (Total Students, Revenue, etc.).
- [x] Comprehensive Activity Logging.
- [x] Dynamic Course Categories via `category_tag`.
- [x] User Exam History tracking.
- [x] User Active/Inactive status tracking.

## 🔑 Environment Variables
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `PAYSTACK_SECRET`
- `CORS_ORIGIN`, `PORT`

## 📚 Project Resources
- **Official Documentation:** [TECHNICAL_REFERENCE.md](file:///c:/Users/Amd/Desktop/Vibes/edtech/TECHNICAL_REFERENCE.md)

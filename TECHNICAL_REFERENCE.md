# Technical Reference Documentation

This document provides the necessary API details for the frontend team to integrate with the EdTech platform backend.

## Base URL
- **Local:** `http://localhost:8989`
- **Production:** `[To be determined]`

## Auth Flow
All protected endpoints require a Bearer token in the `Authorization` header.
- **Login:** Returns a JWT token in the response body (`data.token`) and sets it as an `auth_token` cookie.
- **Subsequent Requests:** Headers must include:
  ```
  Authorization: Bearer <your_jwt_token>
  ```

---

## Endpoints

### POST /auth/register
Registers a new user.
- **Body:** `{ "email": "user@example.com", "username": "user", "password": "password123" }`
- **Sample Request:**
  ```bash
  curl -X POST http://localhost:8989/auth/register \
       -H "Content-Type: application/json" \
       -d '{"email":"test@test.com", "username":"test", "password":"password"}'
  ```
- **Sample Response (201 OK):**
  ```json
  { "success": true, "data": { "id": 1, "username": "test", "email": "test@test.com" }, "message": "User registered successfully" }
  ```

### POST /auth/login
Authenticates a user and provides a token.
- **Body:** `{ "email": "user@example.com", "password": "password123" }`
- **Sample Request:**
  ```bash
  curl -X POST http://localhost:8989/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@test.com", "password":"password"}'
  ```
- **Sample Response (200 OK):**
  ```json
  { "success": true, "data": { "user": { "id": 1, ... }, "token": "jwt_token_here" }, "message": "Login successful" }
  ```

### GET /courses
Fetches all available courses.
- **Sample Request:**
  ```bash
  curl -X GET http://localhost:8989/courses
  ```
- **Sample Response (200 OK):**
  ```json
  { "success": true, "data": [ { "id": 1, "title": "Node.js Basics", ... } ], "message": "Courses fetched successfully" }
  ```

### GET /courses/:id
Fetches details of a specific course, including its lessons.
- **Sample Request:**
  ```bash
  curl -X GET http://localhost:8989/courses/1
  ```
- **Sample Response (200 OK):**
  ```json
  { "success": true, "data": { "id": 1, "title": "...", "lessons": [...] }, "message": "Course details fetched" }
  ```

### GET /lessons/:id
Fetches details of a specific lesson (Authenticated).
- **Headers:** `Authorization: Bearer <token>`
- **Sample Request:**
  ```bash
  curl -X GET http://localhost:8989/lessons/1 -H "Authorization: Bearer <token>"
  ```
- **Sample Response (200 OK):**
  ```json
  { "success": true, "data": { "id": 1, "video_id": "...", "library_id": "...", ... }, "message": "Lesson fetched" }
  ```

### POST /lessons/:id/complete
Marks a lesson as completed (Authenticated).
- **Headers:** `Authorization: Bearer <token>`
- **Sample Request:**
  ```bash
  curl -X POST http://localhost:8989/lessons/1/complete -H "Authorization: Bearer <token>"
  ```

### GET /courses/:id/exam
Fetches the exam questions for a course (Authenticated).
- **Headers:** `Authorization: Bearer <token>`
- **Sample Request:**
  ```bash
  curl -X GET http://localhost:8989/courses/1/exam -H "Authorization: Bearer <token>"
  ```

### POST /courses/:id/exam/submit
Submits exam answers (Authenticated).
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "answers": [{ "questionId": 1, "selectedOption": 0 }, ...] }`
- **Sample Request:**
  ```bash
  curl -X POST http://localhost:8989/courses/1/exam/submit \
       -H "Authorization: Bearer <token>" \
       -H "Content-Type: application/json" \
       -d '{"answers": [{"questionId": 1, "selectedOption": 0}]}'
  ```

### POST /payments/initialize
Initializes a Paystack payment session (Authenticated).
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "courseId": 1 }`
- **Sample Request:**
  ```bash
  curl -X POST http://localhost:8989/payments/initialize \
       -H "Authorization: Bearer <token>" \
       -H "Content-Type: application/json" \
       -d '{"courseId": 1}'
  ```


## Admin Endpoints
*Require `isAdmin` role.*

### GET /admin/users
List all users.

### POST /admin/courses
Create a new course.
- **Body:** `{ "title": "Title", "description": "...", "price": 50 }`

### POST /admin/courses/:id/lessons
Create a lesson for a course with Bunny.net IDs or by uploading a video directly.
- **Content-Type:** `multipart/form-data` (if uploading video) or `application/json` (if providing IDs)
- **Body Fields:**
  - `title`: Lesson title
  - `content`: Lesson content
  - `orderIndex`: Lesson position
  - `videoId`: (Optional) Manual Bunny.net Video ID
  - `libraryId`: (Optional) Manual Bunny.net Library ID
  - `video`: (Optional) Video file to upload
- **Behavior:** If a `video` file is provided, it will be uploaded to Bunny.net Stream, and the resulting `videoId` will be used.

### GET /admin/exams/pending
List all exam submissions that are pending grading.
- **Headers:** `Authorization: Bearer <token>`
- **Sample Response (200 OK):**
  ```json
  { "success": true, "data": [ { "id": 1, "username": "student", "objective_score": 8, "status": "pending", ... } ], "message": "Pending exams fetched" }
  ```

### PATCH /admin/submissions/:id/grade
Grade the theory questions of a specific submission.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "theoryScore": 10 }`
- **Sample Response (200 OK):**
  ```json
  { "success": true, "message": "Submission graded successfully" }
  ```

### POST /admin/submissions/:id/approve
Approve a graded submission, trigger certificate generation, and send an email via Resend.
- **Headers:** `Authorization: Bearer <token>`
- **Sample Response (200 OK):**
  ```json
  { "success": true, "data": { "certificateUuid": "..." }, "message": "Submission approved and certificate generated." }
  ```


# Frontend-Backend Integration Mapping

This document provides a detailed mapping of backend endpoints to the fields and data structures required for the frontend integration.

## 📋 Standard Response Format
All API responses follow this consistent structure:
```json
{
  "success": boolean,
  "data": object | array | null,
  "message": "Descriptive message"
}
```

---

## 🔐 Authentication
**Base Path:** `/auth`

### 1. User Registration
- **Endpoint:** `POST /auth/register`
- **Request Body:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `email` | string | Yes | Unique user email |
  | `username` | string | Yes | Desired username |
  | `password` | string | Yes | Secure password |
- **Response Data:**
  | Field | Type | Description |
  | :--- | :--- | :--- |
  | `id` | integer | Generated user ID |
  | `username` | string | Registered username |
  | `email` | string | Registered email |

### 2. User Login
- **Endpoint:** `POST /auth/login`
- **Request Body:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `email` | string | Yes | Registered email |
  | `password` | string | Yes | User password |
- **Response Data:**
  | Field | Type | Description |
  | :--- | :--- | :--- |
  | `user` | object | User details (excluding password) |
  | `token` | string | JWT Bearer Token |
- **Note:** Login sets an `auth_token` cookie and returns the token in the body. Store the token for subsequent `Authorization: Bearer <token>` headers.

---

## 📚 Courses & Lessons

### 1. List All Courses
- **Endpoint:** `GET /courses`
- **Response Data:** Array of `Course` objects.
  | Field | Type | Description |
  | :--- | :--- | :--- |
  | `id` | integer | Course ID |
  | `title` | string | Course title |
  | `description` | string | Brief overview |
  | `price` | number | Cost in base units (USD/NGN) |
  | `cover_image` | string | URL path to image (e.g., `/uploads/image.png`) |

### 2. Get Course Details
- **Endpoint:** `GET /courses/:id`
- **Response Data:** `Course` object with nested `lessons`.
  | Field | Type | Description |
  | :--- | : :--- | :--- |
  | `lessons` | array | List of `Lesson` objects belonging to the course |

### 3. Get Enrolled Courses (Student Dashboard)
- **Endpoint:** `GET /my-courses`
- **Auth Required:** Yes
- **Response Data:** Array of course enrollments including payment status.

### 4. Get Lesson Details
- **Endpoint:** `GET /lessons/:id`
- **Auth Required:** Yes (Check enrollment first)
- **Response Data (`Lesson`):**
  | Field | Type | Description |
  | :--- | :--- | :--- |
  | `title` | string | Lesson title |
  | `content` | string | Markdown/HTML content |
  | `video_link` | string | External video URL (fallback) |
  <!-- | `video_id` | string | Bunny.net Video ID (for player) |
  | `library_id` | string | Bunny.net Library ID (for player) | -->

### 5. Mark Lesson Complete
- **Endpoint:** `POST /lessons/:id/complete`
- **Auth Required:** Yes
- **Response:** Simple success/failure.

---

## ✍️ Exams & Certificates

### 1. Get Course Exam
- **Endpoint:** `GET /courses/:id/exam`
- **Auth Required:** Yes
- **Response Data:**
  | Field | Type | Description |
  | :--- | :--- | :--- |
  | `exam` | object | `{ id, pass_percentage }` |
  | `questions` | array | List of `{ id, type, question_text, options }` (Answers hidden) |

### 2. Submit Exam
- **Endpoint:** `POST /courses/:id/exam/submit`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "answers": [
      { "questionId": 1, "selectedOption": 0 },
      { "questionId": 2, "theoryAnswer": "My detailed answer..." }
    ]
  }
  ```
- **Response Data:** `{ submissionId, objectiveScore, status: 'pending' }`

---

## 💳 Payments (Paystack)

### 1. Initialize Payment
- **Endpoint:** `POST /payments/initialize`
- **Auth Required:** Yes
- **Request Body:** `{ "courseId": 1 }`
- **Response Data:**
  | Field | Type | Description |
  | :--- | :--- | :--- |
  | `authorization_url` | string | Redirect the user to this Paystack URL |
  | `reference` | string | Unique transaction reference |

---

## 🛠 Admin Management
*All require `isAdmin: true` status.*

### 1. Create Course
- **Endpoint:** `POST /admin/courses`
- **Content-Type:** `multipart/form-data`
- **Fields:** `title`, `description`, `price`, `coverImage` (File upload)

### 2. Create Lesson
- **Endpoint:** `POST /admin/courses/:id/lessons`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  | Field | Type | Description |
  | :--- | :--- | :--- |
  | `title` | string | Required |
  | `content` | string | Required |
  | `orderIndex`| integer| Required |
  | `video_link` | string | (Optional) External video URL mostly like youtube link |
  | `video` | file | (Optional) Direct upload to Bunny.net |
  | `videoId` | string | (Optional) Manual Bunny.net ID |
  | `libraryId`| string | (Optional) Manual Bunny.net ID |

### 3. Exam Grading Flow
- **Fetch Pending:** `GET /admin/exams/pending`
- **Grade Theory:** `PATCH /admin/submissions/:id/grade` -> Body: `{ "theoryScore": 10 }`
- **Approve & Certify:** `POST /admin/submissions/:id/approve` -> Triggers certificate email.

### 4. Exam & Question CRUD
- **Create Exam:** `POST /admin/courses/:id/exam` -> Body: `{ "passPercentage": 80 }`
- **Add Question:** `POST /admin/exams/:id/questions`
  - Body: `{ "type": "objective|theory", "question_text": "...", "options": ["A", "B"], "correct_option": 0 }`

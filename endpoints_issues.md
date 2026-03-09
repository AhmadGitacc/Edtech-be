# API Gap Analysis & Issues

This document outlines discrepancies between the Citycruise frontend requirements and the available backend API endpoints as defined in [FRONTEND_API_MAPPING.md]

## Critical Gaps

### Admin Management
- **Course Deletion**: The [AdminCourseManager.jsx](file:///c:/Users/Amd/Desktop/Vibes/Citycruise/city-cruise-platform/src/pages/AdminCourseManager.jsx) UI includes deletion capabilities, but there is no `DELETE /admin/courses/:id` endpoint.
- **Lesson Deletion**: No endpoint exists to remove lessons from a course (`DELETE /admin/lessons/:id`).
- **Student Search/Filter**: `GET /admin/students` returns all students. For large datasets, a server-side search (`GET /admin/students?q=...`) and pagination are needed.
- **Admin Dashboard Statistics**: No endpoint provides aggregated statistics (Total Students, Total Revenue, Active Enrollments, etc.) as seen in [AdminDashboard.jsx](file:///c:/Users/Amd/Desktop/Vibes/Citycruise/city-cruise-platform/src/pages/AdminDashboard.jsx).
- ****:
- **Activity logs**: an endpoint and separate table to save and map out all relevant user activity comprehensively like payments for courses, course completion, exam completion etc.

### User Account status
the user table should have a column to track if the user is active or not. and an endpoint to update it. on login and logout the user should be marked as active or inactive.

### Content Management
- **Course Category Management**: Categories are currently hardcoded in the frontend. An endpoint for `GET /categories` and `POST /admin/categories` would make the system more dynamic.

## UI/UX Recommendations
- **Exam Results History**: An endpoint for `GET /user/exams/history` would improve the learner's journey.


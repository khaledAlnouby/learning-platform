# Learning Platform

A full-stack microservices-based e-learning platform built with Spring Boot and React. The system supports three user roles — **Admin**, **Instructor**, and **Student** — each with their own dedicated dashboard and feature set.

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│   React     │────▶│   User Service   │     │  Notification Service│
│  Frontend   │     │   (Port 8081)    │     │    (Port 8084)       │
│ (Port 5173) │     └──────────────────┘     └──────────────────────┘
│             │     ┌──────────────────┐            ▲        ▲
│             │────▶│  Course Service  │            │        │
│             │     │   (Port 8082)   │────────────┘        │
│             │     └──────────────────┘                     │
│             │     ┌──────────────────┐                     │
│             │────▶│Enrollment Service│─────────────────────┘
│             │     │   (Port 8083)    │
└─────────────┘     └──────────────────┘
```

Each service has its own PostgreSQL database. Services communicate via REST (RestTemplate).

---

## Tech Stack

| Layer      | Technology                              |
|------------|------------------------------------------|
| Backend    | Java 17, Spring Boot 4.1, Spring Security |
| Database   | PostgreSQL (4 separate databases)         |
| Auth       | JWT (JJWT 0.11), BCrypt password hashing  |
| Frontend   | React 18, Vite, Axios, React Router 7     |
| Messaging  | RabbitMQ (configured, AMQP)               |

---

## Services

### User Service — Port 8081
Handles registration, login, and user management.

- JWT-based authentication (24h expiry, HS256)
- BCrypt password encoding
- Roles: `ADMIN`, `INSTRUCTOR`, `STUDENT`
- Endpoints: `POST /api/users/auth/register`, `POST /api/users/auth/login`, `GET /api/users`, `DELETE /api/users/{id}`, etc.

### Course Service — Port 8082
Manages course lifecycle and student reviews.

- Course status workflow: `PENDING` → `APPROVED` / `REJECTED`
- Atomic enrolled-student counter (JPA `@Modifying` query)
- Average rating recalculated on every new review
- Notifies instructor when a student submits a review
- Endpoints: `GET /api/courses/approved`, `POST /api/courses`, `PATCH /api/courses/{id}/status`, `POST /api/courses/reviews`, etc.

### Enrollment Service — Port 8083
Handles student enrollment requests and instructor responses.

- Statuses: `PENDING` → `ACCEPTED` / `REJECTED` / `CANCELLED`
- On accept: increments course enrolled counter via course-service
- On every status change: sends notification via notification-service
- Endpoints: `POST /api/enrollments`, `PATCH /api/enrollments/{id}/accept`, `PATCH /api/enrollments/{id}/reject`, `PATCH /api/enrollments/{id}/cancel`

### Notification Service — Port 8084
Stores and serves in-app notifications for all users.

- Notifications are created by enrollment-service and course-service
- Endpoints: `POST /api/notifications`, `GET /api/notifications/student/{userId}`, `PATCH /api/notifications/{id}/read`

---

## Features by Role

### Admin
- **Overview**: platform stats (total users, courses, enrollments)
- **Users tab**: view all students and instructors, search/filter by role, remove accounts
- **Courses tab**: view all courses with full details, approve/reject/revoke/re-approve, edit course fields, delete courses
- **Analytics tab**: most enrolled courses, highest rated courses, all reviews across the platform

### Instructor
- **Register** with name, email, password, affiliation, years of experience, and bio
- **My Courses**: create courses (submitted for admin approval), edit, delete, search by name/category, sort by rating
- **Course Detail modal**: all course info + full list of student reviews
- **Browse All Courses**: search, filter by category, sort by rating across the entire platform
- **Enrollment Requests**: see pending student requests with student name/email, accept or reject
- **Notifications**: receive alerts when students review their courses, with mark-as-read

### Student
- **Register** with name, email, password, affiliation, and bio
- **Browse Courses**: search by name/category, sort by rating, view enrollment status per course
- **Enroll**: send enrollment request; cancel if pending or accepted
- **Reviews**: students with an accepted enrollment can rate (1–5) and leave a comment
- **Notifications**: receive updates for enrollment status changes, mark individual notifications as read

---

## Getting Started

### Prerequisites
- Java 17+
- Maven
- Node.js 18+
- PostgreSQL running on `localhost:5433`
- (Optional) RabbitMQ on default port 5672

### 1. Create Databases

Connect to PostgreSQL and run:

```sql
CREATE DATABASE users_db;
CREATE DATABASE courses_db;
CREATE DATABASE enrollment_db;
CREATE DATABASE notification_db;
```

Or run the provided script:

```bash
psql -U postgres -f create-databases.sql
```

> Default credentials used by all services: `username=postgres`, `password=root`

### 2. Start All Services

**Windows (PowerShell):**
```powershell
.\start-all.ps1
```

**Manual (run each in a separate terminal):**
```bash
cd user-service       && ./mvnw spring-boot:run
cd course-service     && ./mvnw spring-boot:run
cd enrollment-service && ./mvnw spring-boot:run
cd notification-service && ./mvnw spring-boot:run
cd frontend           && npm install && npm run dev
```

### 3. Open the App

Navigate to [http://localhost:5173](http://localhost:5173)

### 4. Create an Admin Account

Register via the API (the UI registration form only supports Student and Instructor):

```bash
curl -X POST http://localhost:8081/api/users/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@example.com",
    "password": "yourpassword",
    "role": "ADMIN"
  }'
```

Then log in at [http://localhost:5173/login](http://localhost:5173/login).

---

## Project Structure

```
learning-platform/
├── user-service/           # Spring Boot — auth & user management
├── course-service/         # Spring Boot — courses & reviews
├── enrollment-service/     # Spring Boot — enrollment workflow
├── notification-service/   # Spring Boot — in-app notifications
├── frontend/               # React + Vite
│   └── src/
│       ├── pages/          # AdminDashboard, InstructorDashboard, StudentDashboard, Login, Register
│       ├── components/     # Layout
│       ├── context/        # AuthContext (JWT state)
│       └── services/       # Axios API client
├── create-databases.sql    # SQL to create all 4 databases
└── start-all.ps1           # PowerShell script to start everything
```

---

## API Overview

| Service      | Base Path          | Port |
|--------------|--------------------|------|
| Users        | `/api/users`       | 8081 |
| Courses      | `/api/courses`     | 8082 |
| Enrollments  | `/api/enrollments` | 8083 |
| Notifications| `/api/notifications` | 8084 |

The Vite dev server proxies all `/api/*` requests to the correct backend service automatically.

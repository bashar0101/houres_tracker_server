# HoursTracker - Server Technical Documentation

This document provides a deep dive into the server-side architecture, file structure, and function-level details of the HoursTracker backend.

---

## 📁 Folder Structure Overview

### `root/`
The entry point of the server application.
- `index.js`: Main server configuration and entry point.
- `.env`: (Ignored) Environment variables for secrets and database URIs.
- `package.json`: Project metadata and dependencies.

### `models/`
Defines the structure of the data stored in MongoDB using Mongoose.
- `User.js`: Schema for user profiles and roles.
- `Company.js`: Schema for workspaces/companies.
- `WorkSession.js`: Schema for tracking work time intervals.

### `routes/`
Contains the API endpoints, organized by resource.
- `auth.js`: Handles identity and access management.
- `work.js`: Logic for time tracking.
- `manager.js`: Administrative features and report generation.
- `companies.js`: Simple resource fetching for companies.

### `middleware/`
Reusable logic that executes before the main route handlers.
- `authMiddleware.js`: Verifies JWT tokens.
- `managerMiddleware.js`: Restricts access to managers only.

### `utils/`
Helper functions and scripts.
- `seeder.js`: Sets up initial database state (like a default admin).

---

## 📄 File & Function Details

### 🟢 `index.js`
**Purpose**: Initializes the Express server, connects to MongoDB, and mounts all route handlers.
- **Why**: Centralizes configuration so that the app starts consistently. Sets up global middleware like `cors` and `body-parser`.

---

### 🟢 Models (`/models`)

#### `User.js`
- **Fields**: `username`, `password` (hashed), `role` (user/manager), `company` (reference), `status` (active/pending), `hourlyRate`.
- **Why**: Stores everything needed to identify a user and calculate their earnings.

#### `Company.js`
- **Fields**: `name`, `owner` (reference).
- **Why**: Allows users to be grouped into workspaces, enabling managers to see only their own employees' data.

#### `WorkSession.js`
- **Fields**: `userId`, `startTime`, `endTime`, `duration`.
- **Why**: The core data point for the application. Tracks exactly when work started and ended.

---

### 🟢 Routes (`/routes`)

#### `auth.js`
- **`POST /register`**: Creates a new user. If they create a company, they become the owner and a manager. If they join, they start as 'pending'.
- **`POST /login`**: Validates credentials and returns a JWT token.
- **`GET /me`**: Fetches the authenticated user's profile.
- **Why**: Securely manages who can access the system and what their current permissions are.

#### `work.js`
- **`POST /start`**: Creates a `WorkSession` with a `startTime`. Prevents multiple active sessions.
- **`POST /stop`**: Finds the active session, sets the `endTime`, and calculates the `duration`.
- **`GET /`**: Fetches all previous sessions for the logged-in user.
- **`GET /active`**: Checks if the user has a session currently running.
- **Why**: Provides the core utility of the app: tracking time.

#### `manager.js`
- **`GET /all-work`**: Fetches work sessions for all employees in the manager's company.
- **`GET /users`**: Lists all employees in the company.
- **`PUT /users/:id/role`**: Updates an employee's role. Now includes a safety check to ensure the **Company Owner** cannot be demoted.
- **`GET /users`**: Now populates company information to identify the owner on the frontend.
- **`GET /requests`**: Shows users who are waiting for approval to join the company.
- **`PUT /requests/:id`**: Approves or rejects a new user.
- **`PUT /users/:id/salary`**: Sets the hourly rate for an employee. Used for earnings calculation.
- **`GET /users/:id/report`**: Generates a PDF report using `PDFKit` for a specific user and month.
- **Why**: Empowers administrators to manage their team and automate financial reporting.

---

### 🟢 Middleware (`/middleware`)

#### `authMiddleware.js`
- **Function**: Extracts the token from the `x-auth-token` header, verifies it with the secret key, and attaches the user payload to the `req` object.
- **Why**: Ensures that only logged-in users can access private data.

#### `managerMiddleware.js`
- **Function**: Checks if `req.user.role` is 'manager'. Returns 403 if not.
- **Why**: Provides a second layer of security for administrative endpoints.

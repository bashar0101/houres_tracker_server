# HoursTracker - Server Side

The backend engine for the HoursTracker application, providing secure authentication, data persistence, and report generation.

## 🛠 Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Security**: JWT (JSON Web Tokens), Bcrypt.js
- **Reports**: PDFKit

---

## 🚀 Step-by-Step: How this app was built

### 1. Server Setup
The server was built using Express.js with a modular route structure. Middleware like `cors` and `express.json()` were configured for secure API communication.

### 2. Database Modeling
Three main models were created:
- **User**: Stores profiles, roles (user/manager), and hourly rates.
- **Company**: Manages workspaces that users can join or create.
- **WorkRecord**: Tracks start/end times and durations for each session.

### 3. Authentication Layer
- Implemented JWT-based authentication.
- Created `authMiddleware` to protect private routes.
- Added a `/me` endpoint to provide fresh user data to the frontend for real-time role synchronization.

### 4. Managerial Features
- **Company Logic**: Dynamically handle company creation and approval-based joining.
- **PDF Generation**: Built a report engine using `PDFKit` to calculate earnings and generate monthly work summaries for employees.

---

## 🛠 How to Build & Run Locally

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root:
    ```env
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret_key
    PORT=5000
    ```

3.  **Run Server**:
    - Development (with nodemon): `npm run dev`
    - Production: `npm start`

---

## 🌐 Deployment

### Render / Railway / Heroku
1.  Push your code to GitHub.
2.  Connect to your hosting provider.
3.  Add your **Environment Variables** (from `.env`) in the provider's dashboard.
4.  Set the **Start Command** to `npm start`.
5.  Deploy!

### MongoDB Atlas
Ensure your IP is whitelisted in MongoDB Atlas or set to `0.0.0.0/0` for cloud deployment.

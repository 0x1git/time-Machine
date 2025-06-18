# TimeTracker - Full-Stack Time Tracking Platform

A complete time-tracking and productivity monitoring platform built with React and Node.js

## Features

- 🔐 **Secure Authentication** - JWT-based login/registration
- ⏱️ **Time Tracking** - Start/stop timer with project and task selection
- 📊 **Analytics Dashboard** - Visual insights with charts and statistics
- 🏗️ **Project Management** - Create and manage projects with team members
- ✅ **Task Management** - Organize work with tasks and priorities
- 📈 **Reports & Analytics** - Detailed time reports and productivity insights
- 👥 **Team Collaboration** - Invite team members and assign roles
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🌙 **Dark/Light Mode** - Toggle between themes
- 📧 **Notifications** - Email and push notifications for important updates

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- bcryptjs for password hashing
- Express Validator for input validation
- CORS for cross-origin requests

### Frontend
- React 18 with Hooks
- React Router for navigation
- Styled Components for styling
- Chart.js for data visualization
- Axios for API calls
- React Toastify for notifications
- React Icons
- Formik & Yup for form handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

## Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd time-tracker
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/timetracker
JWT_SECRET=super_secure_jwt_secret_key_for_time_tracker_2025
JWT_EXPIRE=7d
NODE_ENV=development

# Email Configuration 
EMAIL_USER=your@gmail.com
EMAIL_PASS=your pass
FRONTEND_URL=http://localhost:3000

```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false
```

### 4. Database Setup

Make sure MongoDB is running on your system. The application will automatically create the database and collections when you start using it.

For MongoDB Atlas (cloud):
1. Create a free account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Get your connection string
4. Replace the MONGODB_URI in backend/.env

## Running the Application

### Start the Backend Server
```bash
cd backend
npm run dev
```
The backend will run on http://localhost:5000

### Start the Frontend Application
```bash
cd frontend
npm start
```
The frontend will run on http://localhost:3000

## Usage

1. **Registration/Login**: Create a new account or login with existing credentials
2. **Create Projects**: Set up projects to organize your work
3. **Create Tasks**: Add tasks to projects for better organization
4. **Track Time**: Use the timer to track time spent on projects/tasks
5. **View Reports**: Analyze your productivity with detailed reports and charts
6. **Manage Team**: Invite team members and assign them to projects
7. **Settings**: Customize your profile and notification preferences

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add team member

### Tasks
- `GET /api/tasks` - Get tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Time Entries
- `GET /api/time-entries` - Get time entries
- `POST /api/time-entries` - Create time entry
- `PUT /api/time-entries/:id` - Update time entry
- `POST /api/time-entries/:id/stop` - Stop running timer
- `GET /api/time-entries/running` - Get current running timer
- `DELETE /api/time-entries/:id` - Delete time entry

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/time-by-project` - Time breakdown by project
- `GET /api/reports/daily-activity` - Daily activity data
- `GET /api/reports/timesheet` - Detailed timesheet

### Users
- `GET /api/users/search` - Search users
- `PUT /api/users/:id` - Update user profile

## Project Structure

```
time-tracker/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── TimeEntry.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   ├── timeEntries.js
│   │   ├── users.js
│   │   └── reports.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   ├── dashboard/
    │   │   ├── layout/
    │   │   ├── projects/
    │   │   ├── tasks/
    │   │   ├── timer/
    │   │   ├── reports/
    │   │   └── settings/
    │   ├── contexts/
    │   │   ├── AuthContext.js
    │   │   └── ThemeContext.js
    │   ├── styles/
    │   │   └── GlobalStyles.js
    │   ├── App.js
    │   └── index.js
    ├── .env
    └── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please create an issue in the repository.

---

Built with ❤️ using React and Node.js

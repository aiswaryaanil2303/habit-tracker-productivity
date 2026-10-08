# Habit Tracker & Productivity Web Application

A full-stack habit tracking and productivity management website built using **Python, Django, SQLite, HTML5, and Modern Vanilla CSS (Glassmorphism Dark Theme)**.

---

## 🌟 Key Features

### 1. 👤 User Module
- **Authentication**: User Registration, Login, Logout, and Forgot Password flow.
- **Profile Management**: Profile bio, custom glow avatar colors, and reminder preferences.
- **Habit Management**: Create, edit, delete, categorize (Health, Work, Study, Finance, Mind, Social, Custom), and set daily/weekly goals.
- **Habit Tracking**: Dynamic AJAX daily check-off list with sound effects, consecutive streak calculation, best streaks, 30-day completion rates, and missed habit tracking.
- **Templates Gallery**: Browse, clone approved habit templates directly to your checklist, or submit suggestions for admin review.

### 2. 🛡️ Admin Module
- **Admin Dashboard**: Real-time analytics, total users, active accounts, daily completions, platform productivity scores, and visual charts (Chart.js) for user growth, completion trends, and category distribution.
- **User Management**: Search users, add new accounts, edit profiles, toggle block/unblock status, reset passwords, delete accounts, and view detailed individual user productivity reports.
- **Habit Management**: Supervise all platform habits, filter by category/user, delete inappropriate habits, and toggle archiving.
- **Template Approvals**: Review and approve/reject user-submitted public habit templates.

---

## 🛠️ Tech Stack
- **Backend**: Python 3, Django (MVT Architecture)
- **Database**: SQLite3
- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphic Dark UI & Flexbox/Grid), JavaScript (Fetch AJAX & Web Audio API)
- **Libraries**: Chart.js (Data visualizations), FontAwesome 6 (Icons), Google Fonts (Outfit)

---

## 🚀 Getting Started Locally

### Prerequisites
Make sure you have Python installed on your system.

### Installation & Setup

1. **Clone or download the repository:**
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd "Habit Tracker and Productivity project"
   ```

2. **Create and activate a virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt):**
     ```cmd
     python -m venv .venv
     .venv\Scripts\activate.bat
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Apply database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Run the local development server:**
   ```bash
   python manage.py runserver
   ```

6. Open your browser and navigate to:
   👉 **`http://127.0.0.1:8000/`**

---

## 🔑 Default Admin Account
- **Username**: `admin`
- **Password**: `admin123`

---

## 📂 Project Structure
```text
├── config/              # Django project configuration & settings
├── tracker/             # Main habit tracker application
│   ├── migrations/      # Database migrations
│   ├── static/          # Custom CSS (styles.css) & JS (tracker.js)
│   ├── templates/       # HTML templates (User & Admin views)
│   ├── forms.py         # Form definitions
│   ├── models.py        # Database models (UserProfile, Habit, HabitLog)
│   ├── urls.py          # App routing
│   ├── views.py         # Controller logic & analytics
│   └── tests.py         # Unit test suite
├── .gitignore           # Git ignore file
├── manage.py            # Django CLI management script
├── requirements.txt     # Project dependencies
└── README.md            # Documentation
```

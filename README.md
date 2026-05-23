# Tecno Lab (تكنو لاب) 🎓

A modern, comprehensive Learning Management System (LMS) and organizational platform developed for the Al-Irfan Charitable Association. Tecno Lab streamlines student enrollment, course management, shift scheduling, and administrative operations.

## 🚀 Features

### For Students
* **Seamless Onboarding:** Easy registration using Google OAuth.
* **Smart Dashboard:** Personalized view of available courses and current enrollments.
* **Gender-Based Filtering:** Automatic display of courses based on the student's designated shift (Male/Female/Mixed).
* **Course Details & Tracking:** Easy access to course files, WhatsApp groups, and assignment submissions.

### For Administrators & Instructors
* **Centralized Control Panel:** Manage users, courses, and platform operations from a single dashboard.
* **Course Creation & Management:** Easily add new courses, specify target audiences (gender shifts), and manage course materials (URLs, thumbnails, etc.).
* **Role-Based Access Control:** Secure environment ensuring only authorized personnel can approve requests or alter course data.

## 🛠️ Technology Stack

* **Frontend:** React (Vite)
* **Routing:** TanStack Router
* **Styling:** Tailwind CSS + Radix UI (shadcn/ui)
* **Backend & Database:** Supabase (PostgreSQL, Auth, RLS)
* **Deployment:** Vercel

## ⚙️ Local Development Setup

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/M23xxp/tecnolab.git](https://github.com/M23xxp/tecnolab.git)
    cd tecnolab
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

## 🗄️ Database Schema Overview

The core of the application relies on Supabase with Row Level Security (RLS) enabled. Key tables include:
* `profiles`: User profiles linked to Supabase Auth.
* `students`: Detailed student information including gender.
* `courses`: Course metadata including `target_gender` for shift filtering.
* `enrollments`: Tracks student requests and course participation status.

## 📄 License & Copyright

**Copyright © 2026 Mohmmad Ayman Al-Ansari. All Rights Reserved.**

This repository and its contents are provided for viewing and portfolio purposes only. 

* You may view and study the code.
* You **MAY NOT** copy, distribute, modify, or use any part of this code for commercial or non-commercial projects without explicit written permission from the author.
* This project is **NOT** licensed under an open-source initiative.

For inquiries or permissions, please contact the author.

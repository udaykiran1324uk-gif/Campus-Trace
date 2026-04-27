# Campus-Trace
A high-performance, full-stack lost-and-found ecosystem for university campuses. It bridges the gap between losing an item and finding it through real-time notifications, secure claim management, and a professional-grade UI built with Tailwind CSS and React.
# 📍 CampusTrace: University Lost & Found Portal

**CampusTrace** is a professional full-stack web platform designed to streamline the reporting and retrieval of lost items within a university campus. Built with a "Security-First" mindset, it features role-based access, real-time database updates, and an automated startup architecture.

---

## ✨ Key Features

- **🔐 Secure Authentication:** Student signup/login powered by Firebase Auth.
- **📸 Multi-Media Posts:** Upload item descriptions along with images stored via Firebase Storage.
- **🔍 Smart Search:** Filter through lost and found items by category, location, or keywords.
- **🤝 Claim Management:** A request-and-approval system allowing owners to verify claims.
- **🌓 Modern UI:** Fully responsive design using Tailwind CSS with built-in Dark Mode support.
- **🛡️ Admin Oversight:** Dedicated panel to manage users and remove duplicate entries.

---

## 🛠️ Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js (Hooks, Context API), Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | Firebase Firestore (NoSQL) |
| **Storage** | Firebase Cloud Storage |
| **Automation** | Batch Scripting (.bat) |

---

## 🚀 Quick Start (Local Setup)

I have automated the environment startup to make it as easy as possible to get running.

### Option 1: The "One-Click" Method (Windows)
1. Open the `campus-lost-and-found` folder.
2. Double-click the `start_portal.bat` file.
3. Your browser will automatically be ready at **http://localhost:3000**.

### Option 2: Using the Terminal
If you prefer the command line, simply run the following command from the root folder:

Navigate to the correct folder:
Run in terminal
cd "C:\Users\udayk\web projects\Campus-Trace\campus-lost-and-found"
Start the website:
npm run dev

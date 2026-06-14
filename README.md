# GymSoft — Comprehensive Fitness Club SaaS Platform

GymSoft is a modern, full-stack Software-as-a-Service (SaaS) application designed for managing fitness clubs and gym chains. It provides a multi-tenant environment where gym owners can manage multiple locations, employees, and clients from a single centralized dashboard.

The system is designed with a role-based architecture catering to Gym Owners, Employees (Receptionists, Personal Trainers), and Clients, offering dedicated portals and features for each user type.

## 🚀 Tech Stack

- **Backend:** Java 21, Spring Boot 3, Spring Security (JWT), Spring Data JPA
- **Database:** PostgreSQL 14+, Flyway for schema migrations
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router v6
- **Architecture:** RESTful API with a multi-tenant data model

## ✨ Key Features

### 🏢 Owner Portal
- **Multi-Gym Management:** Create and manage multiple gym locations under one owner account.
- **Employee Management:** Hire staff, assign custom roles (Receptionist, Trainer, Manager), and configure granular permissions (e.g., selling products, managing classes).
- **Analytics & Reporting:** View real-time revenue stats, product sales, pass purchases, and class ratings.
- **Global Configuration:** Manage pass types (memberships), product inventory for the POS system, locker counts, and employee work schedules.
- **Audit Logs:** Full history of employee actions for security and tracking.

### 💼 Employee / Trainer Portal
- **Reception POS:** Sell gym passes and physical products (drinks, supplements) with a built-in barcode scanner simulator.
- **Access Control (Check-in/out):** Validate client passes and assign lockers dynamically.
- **Personal Trainer Tools:** Manage personal availability via an interactive drag-and-drop calendar. View and cancel booked personal training sessions.
- **Class Management:** Schedule fitness classes and manage attendance.

### 🏃 Client Portal
- **Gym Discovery:** Browse available gyms, their class schedules, and their roster of personal trainers.
- **Online Booking:** Book and pay for personal training sessions and group fitness classes.
- **Membership Management:** Purchase and view active gym passes (memberships).

## 🛠 Prerequisites

Before running the application, ensure you have the following installed:
- Java 21 JDK
- Maven 3.9+
- Node.js 20+
- PostgreSQL 14+

## ⚙️ Running Locally

### 1. Database Setup

Create a PostgreSQL database named `gym_management`:

```sql
CREATE DATABASE gym_management;
```

### 2. Backend

Navigate to the root directory and run the Spring Boot application. The application uses Flyway to automatically create the necessary database tables and seed initial data.

```bash
# Optional environment variables (defaults to localhost/postgres)
export DB_URL=jdbc:postgresql://localhost:5432/gym_management
export DB_USERNAME=postgres
export DB_PASSWORD=root
export JWT_SECRET=your-very-long-jwt-secret-key-min-32-chars

mvn spring-boot:run
```

The backend API will start on `http://localhost:8080`.

### 3. Frontend

Navigate to the `frontend` directory, install dependencies, and start the development server:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will be available at `http://localhost:5173`.

## 🔐 User Roles & Authentication

The application uses JSON Web Tokens (JWT) for authentication. Upon registration or login, the server issues a JWT that must be included in the `Authorization: Bearer <token>` header of subsequent API requests.

| Role | Description |
|------|-------------|
| **OWNER** | Super-admin for their gym chain. Has access to all gyms they created, analytics, and employee management. |
| **EMPLOYEE** | Staff member hired by an owner. Access is restricted to specific gyms and controlled by granular permissions (e.g., `SELL_PRODUCTS`, `PERSONAL_TRAINER`). |
| **GUEST** | A standard gym client. Can browse schedules, buy passes, and book trainers. |

### Getting Started

To create the first account (Owner), use the registration form on the frontend or send a POST request:
`POST /api/auth/register`

Once registered as an owner, you can create a Gym and hire employees from the Owner Dashboard.

## 🕰 Background Jobs (Cron)

The Spring Boot backend utilizes `@Scheduled` tasks to automate routine operations:

```properties
# Expire old passes at 01:00 AM daily
app.jobs.expire-passes-cron=0 0 1 * * *

# Send notifications for passes expiring within 3 days at 08:00 AM
app.jobs.expiring-notifications-cron=0 0 8 * * *
```

## 🧪 Testing

To run the backend test suite:
```bash
mvn test
```

To run frontend tests (if configured):
```bash
cd frontend
npm test
```

## 📁 Project Structure

### Backend
- `/src/main/java/com/jagorczyk/gymManagement/api` — REST Controllers
- `/src/main/java/com/jagorczyk/gymManagement/domain` — JPA Entities
- `/src/main/java/com/jagorczyk/gymManagement/service` — Business Logic
- `/src/main/java/com/jagorczyk/gymManagement/security` — JWT & Authentication configuration
- `/src/main/resources/db/migration` — Flyway SQL schema migrations

### Frontend
- `/frontend/src/pages` — Main React views organized by role (`/owner`, `/employee`, `/client`)
- `/frontend/src/components` — Reusable UI components
- `/frontend/src/routes` — React Router configurations and role-based route guards
- `/frontend/src/api.ts` — API client wrappers for backend communication

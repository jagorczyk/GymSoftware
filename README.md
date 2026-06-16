# Gymlos - Comprehensive Fitness Club SaaS Platform

Gymlos is a modern, full-stack Software-as-a-Service (SaaS) application designed for managing fitness clubs and gym chains. It provides a multi-tenant environment where gym owners can manage multiple locations, employees, and clients from a single centralized dashboard.

The system is designed with a role-based architecture catering to Gym Owners, Employees (Receptionists, Personal Trainers), and Clients, offering dedicated portals and features for each user type.

## Technology Stack

The application leverages a robust set of modern technologies to ensure scalability, security, and a responsive user experience.

### Backend
- **Java 21**: The latest LTS version of Java, offering modern language features, record classes, and optimized performance.
- **Spring Boot 3**: The core framework for building the REST API, managing dependency injection, and configuring the application context.
- **Spring Security & JWT**: Provides secure, stateless authentication and fine-grained authorization (role-based access control) using JSON Web Tokens.
- **Spring Data JPA & Hibernate**: Simplifies database interactions, ORM mapping, and repository abstractions.
- **PostgreSQL 14+**: A powerful, open-source relational database used for robust data storage.
- **Flyway**: Database migration tool ensuring reliable schema versioning across deployments.
- **Lombok**: Reduces boilerplate code in Java classes (e.g., getters, setters, constructors).

### Frontend
- **React 18**: A declarative, efficient, and flexible JavaScript library for building user interfaces.
- **TypeScript**: Adds static typing to JavaScript, improving code quality and developer experience.
- **Vite**: A fast build tool and development server tailored for modern web projects.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development and consistent styling.
- **React Router v6**: Handles client-side routing, nested routes, and role-based navigation guards.
- **Lucide React**: A clean and consistent icon library used throughout the application.

## System Architecture

The architecture is built on a standard Client-Server model. The frontend (React Single Page Application) communicates exclusively with the backend via RESTful APIs. Data isolation is achieved through a multi-tenant logical model where resources (gyms, employees, passes) are strongly tied to the `Owner` account that created them.

## Key Features

### Owner Portal
- **Multi-Gym Management:** Create and manage multiple gym locations under one owner account.
- **Employee Management:** Hire staff, assign custom roles (Receptionist, Trainer, Manager), and configure granular permissions (e.g., selling products, managing classes).
- **Analytics & Reporting:** View real-time revenue stats, product sales, pass purchases, and class ratings.
- **Global Configuration:** Manage pass types (memberships), product inventory for the POS system, locker counts, and employee work schedules.
- **Audit Logs:** Full history of employee actions for security and tracking.

### Employee / Trainer Portal
- **Reception POS:** Sell gym passes and physical products (drinks, supplements) with a built-in barcode scanner simulator.
- **Access Control (Check-in/out):** Validate client passes and assign lockers dynamically.
- **Personal Trainer Tools:** Manage personal availability via an interactive drag-and-drop calendar. View and cancel booked personal training sessions.
- **Class Management:** Schedule fitness classes and manage attendance.

### Client Portal
- **Gym Discovery:** Browse available gyms, their class schedules, and their roster of personal trainers.
- **Online Booking:** Book and pay for personal training sessions and group fitness classes.
- **Membership Management:** Purchase and view active gym passes (memberships).

## Prerequisites

Before running the application, ensure you have the following installed:
- Java 21 JDK
- Maven 3.9+
- Node.js 20+
- PostgreSQL 14+

## Running Locally

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

## User Roles & Authentication

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

## API Endpoints Overview

The application exposes a wide array of RESTful endpoints organized by role and domain.

### Authentication Controller (`/api/auth`)
- `POST /register` - Registers a new user (default role OWNER).
- `POST /login` - Authenticates a user and returns a JWT.
- `POST /verify-email` - Verifies a user's email address.

### Owner Controller (`/api/owner`)
- `GET /gyms` - Lists all gyms belonging to the logged-in owner.
- `POST /gyms` - Creates a new gym.
- `GET /gyms/{gymId}/employees` - Lists employees for a specific gym.
- `POST /gyms/{gymId}/employees` - Hires a new employee.
- `GET /gyms/{gymId}/stats` - Returns dashboard statistics (active passes, daily revenue, etc.).
- `GET /gyms/{gymId}/history` - Fetches audit logs of employee actions.
- `GET /gyms/{gymId}/pass-types` - Manages gym membership tiers.
- `GET /gyms/{gymId}/products` - Manages product inventory for the POS system.

### Employee Controller (`/api/employee`)
- `GET /gyms` - Lists gyms the employee has access to.
- `GET /gyms/{gymId}/guests` - Lists all registered clients at the gym.
- `POST /gyms/{gymId}/guests/{guestId}/check-in` - Registers a client's entry to the gym.
- `POST /gyms/{gymId}/guests/{guestId}/check-out` - Registers a client's exit.
- `POST /gyms/{gymId}/lockers/assign` - Assigns a locker to a client upon entry.
- `POST /gyms/{gymId}/scan-checkin` - Simulates a barcode scan for fast entry.
- `GET /gyms/{gymId}/calendar-events` - Retrieves the work schedule for the logged-in employee.
- `POST /gyms/{gymId}/trainer/availabilities` - Manages personal trainer availability slots.
- `DELETE /gyms/{gymId}/trainer/trainings/{trainingId}` - Cancels a booked personal training session.

### Client Portal Controller (`/api/client`)
- `GET /gyms/all` - Lists all available gyms for discovery.
- `GET /gyms/{gymId}/dashboard` - Client's personalized dashboard for a specific gym.
- `POST /gyms/{gymId}/purchase-pass` - Purchases a membership for the selected gym.
- `GET /gyms/{gymId}/classes` - Lists upcoming group fitness classes.
- `POST /gyms/{gymId}/classes/{classId}/book` - Books a spot in a class.
- `GET /gyms/{gymId}/trainers` - Lists available personal trainers.
- `POST /gyms/{gymId}/trainers/{trainerId}/book` - Books a personal training session.

### Other Controllers
- **Analytics Controller**: Endpoints for generating revenue and attendance charts.
- **CRM Controller**: Manages marketing campaigns and client communication.
- **Group Class Controller**: Manages the schedule and capacity of group fitness classes.
- **Stripe Webhook Controller**: Handles asynchronous payment confirmations from Stripe.

## Background Jobs (Cron)

The Spring Boot backend utilizes `@Scheduled` tasks to automate routine operations:

```properties
# Expire old passes at 01:00 AM daily
app.jobs.expire-passes-cron=0 0 1 * * *

# Send notifications for passes expiring within 3 days at 08:00 AM
app.jobs.expiring-notifications-cron=0 0 8 * * *
```

## Testing

To run the backend test suite:
```bash
mvn test
```

To run frontend tests (if configured):
```bash
cd frontend
npm test
```

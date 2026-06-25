# Watch Guard - Shared Expense Tracker

Watch Guard is a modern, premium full-stack web application that allows groups (roommates, colleagues, friends, travel groups) to easily log and track shared expenses. The system automatically performs debt-simplification (Splitwise style) to minimize the number of repayment transactions required to balance the books.

---

## Technical Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons, Axios.
- **Backend**: Spring Boot 3 REST API, Spring Security, JWT Auth, JPA, Lombok, Validation.
- **Database**: PostgreSQL (Production) / H2 (Development fallback).
- **Deployment**: Docker, Docker Compose, Vercel (Frontend).

---

## Key Features
- **Secure Authentication**: User registration and JWT-based session login.
- **Group Management**: Create groups and invite members via unique 8-character invite codes or email lookup.
- **Flexible Splitting**: Add expenses and choose to split them **Equally** (with checkboxes and live previews), **Exactly** (custom amounts with live balance validation), or by **Percentage** (live sum calculation).
- **Repayment Tracking**: Log settlements and record repayments directly inside groups.
- **Premium Analytics**: View monthly totals, individual balances, and simplified debt sheets on a responsive dashboard.
- **Multi-lingual & RTL**: Fully supports **English**, **French**, and **Arabic** (with automatic LTR/RTL layout switching).
- **Dark Mode**: Smooth transitions between light and dark themes.
- **System Currency**: All expenses are tracked in **MAD (Moroccan Dirham)**.
- **Notification Center**: Real-time polling notification center alerts users about new expenses, added groups, and settlements.

---

## Folder Structure
```
Watch Guard/
├── backend/                  # Spring Boot Java REST API
│   ├── src/                  # Source files (JPA models, Security, Controllers)
│   ├── pom.xml               # Maven configuration
│   └── Dockerfile            # Container build recipe
├── frontend/                 # React SPA (Vite + TS)
│   ├── src/                  # Pages, Contexts, and API services
│   ├── index.html            # Web entry and metadata tags
│   ├── tailwind.config.js    # Customized dark mode color design
│   ├── nginx.conf            # SPA routing config for docker Nginx container
│   └── Dockerfile            # Container build recipe
├── docker-compose.yml        # Orchestration configuration
├── download-maven.ps1        # Standalone local Maven utility script
└── README.md                 # Project instructions
```

---

## Getting Started

### Prerequisites
- [Java Development Kit (JDK) 17](https://www.oracle.com/java/technologies/downloads/#java17)
- [Node.js (v20 or higher)](https://nodejs.org/) & `npm`

---

### Option 1: Run Locally (Quick Start - Zero Database Config)
This setup runs the backend with an in-memory **H2 database**, requiring zero installation or database setup.

#### 1. Download Maven (If not globally installed)
Run the script to download Apache Maven into the workspace:
```powershell
powershell -ExecutionPolicy Bypass -File download-maven.ps1
```

#### 2. Start the Backend API
Compile and run the Spring Boot application:
```powershell
# Compiles and boots the backend using the local maven instance
.\apache-maven-3.9.6\bin\mvn spring-boot:run -f backend/pom.xml
```
*The backend API will run on `http://localhost:8080`.*
*H2 database console is accessible at `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:sharedexpensesdb`, Username: `sa`, Password: `password`).*

#### 3. Start the Frontend Dev Server
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The React application will launch on `http://localhost:5173` (or similar active port displayed in console).*

---

### Option 2: Run via Docker (Full Production Setup with PostgreSQL)
To build and run the entire ecosystem (database, backend server, and frontend server) in containers:

```bash
# Builds images and starts all containers in the background
docker-compose up --build -d
```
- **React Frontend**: `http://localhost:3000`
- **Spring Boot API**: `http://localhost:8080/api`
- **PostgreSQL Database**: Port `5432`

---

## Neon Production Database Configurations
For your deployment on Render, use the following Environment Variables corresponding to your Neon database:
- **`DB_HOST`**: `ep-round-dream-aty08a5t.c-9.us-east-1.aws.neon.tech`
- **`DB_PORT`**: `5432`
- **`DB_NAME`**: `neondb`
- **`DB_USER`**: `neondb_owner`
- **`DB_PASSWORD`**: `npg_c3khevFQHL0b`
- **`SPRING_PROFILES_ACTIVE`**: `prod`

---

## Deploying to GitHub and Vercel

### 1. Push Code to GitHub
Ensure you have initialized a Git repository, committed the files, and linked your GitHub repository:
```bash
# Initialize git
git init

# Create .gitignore for Maven, Node, and IDE files
# (already pre-configured in project folders)

# Stage and commit
git add .
git commit -m "Initial commit of Watch Guard Web Application"

# Add remote and push (replace with your repository url)
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. Deploy Frontend to Vercel
Vercel is optimal for deploying the React + TypeScript frontend:
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project** and select your GitHub repository.
3. Configure the directory settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Set Environment Variables:
   - **`VITE_API_URL`**: Point this to your hosted backend API URL (e.g., `https://api.yourdomain.com`).
5. Click **Deploy**. Vercel will build and host your frontend application on an SSL-secured URL.

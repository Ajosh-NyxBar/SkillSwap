# SkillSwap Backend

REST API backend for SkillSwap platform built with Go + Gin + GORM + PostgreSQL.

## Tech Stack

- **Framework**: Go + Gin
- **Database**: PostgreSQL + GORM
- **Authentication**: JWT
- **Validation**: go-playground/validator
- **CORS**: gin-contrib/cors

## Features

- User registration and authentication
- Skill management (CRUD)
- Skill matching system
- Exchange requests
- JWT-based authorization

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/:id` - Get user by ID

### Skills
- `POST /api/skills` - Create new skill
- `GET /api/skills` - Get all skills (with filters)
- `GET /api/skills/my` - Get current user's skills
- `GET /api/skills/:id` - Get skill by ID
- `PUT /api/skills/:id` - Update skill
- `DELETE /api/skills/:id` - Delete skill

### Exchanges
- `POST /api/exchanges` - Create exchange request
- `GET /api/exchanges` - Get user's exchanges
- `GET /api/exchanges/:id` - Get exchange by ID
- `PUT /api/exchanges/:id/status` - Update exchange status

### Matches
- `GET /api/matches` - Get skill matches for current user

## Setup Instructions

### Prerequisites

- Go 1.21 or higher
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skillswap/backend
   ```

2. **Install dependencies**
   ```bash
   go mod tidy
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your database configuration:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your-password
   DB_NAME=skillswap_db
   DB_SSLMODE=disable
   JWT_SECRET=your-super-secret-jwt-key
   PORT=8080
   FRONTEND_URL=http://localhost:3000
   ```

4. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE skillswap_db;
   ```

5. **Run the application**
   ```bash
   go run cmd/main.go
   ```

The server will start on `http://localhost:8080`

### Development

**Run with hot reload** (install Air first):
```bash
go install github.com/cosmtrek/air@latest
air
```

**Run tests**:
```bash
go test ./...
```

## Database Schema

### Users
- ID, Email, Username, Password, FullName
- Bio, Avatar, Location
- Timestamps

### Skills
- ID, UserID, Title, Description, Category
- Level (beginner/intermediate/advanced/expert)
- SkillType (offering/seeking)
- Tags, IsActive, Timestamps

### Exchanges
- ID, RequesterID, SkillID, Message
- Status (pending/accepted/rejected/completed/cancelled)
- ResponseText, Timestamps

## API Usage Examples

### Register User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "john_doe",
    "password": "password123",
    "full_name": "John Doe"
  }'
```

### Create Skill
```bash
curl -X POST http://localhost:8080/api/skills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Guitar Lessons",
    "description": "Teach basic guitar techniques",
    "category": "Music",
    "level": "intermediate",
    "skill_type": "offering",
    "tags": "guitar,music,lessons"
  }'
```

### Get Matches
```bash
curl -X GET http://localhost:8080/api/matches \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Deployment

### Railway/Render Deployment

1. **Connect repository** to Railway/Render
2. **Set environment variables** in the dashboard
3. **Deploy** - the service will automatically build and run

### Environment Variables for Production
```env
DB_HOST=your-postgres-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_SSLMODE=require
JWT_SECRET=your-production-jwt-secret
PORT=8080
GIN_MODE=release
FRONTEND_URL=https://your-frontend-domain.com
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

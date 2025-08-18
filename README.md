# SkillSwap - Platform Tukar Keterampilan Online

Platform inovatif untuk pertukaran keterampilan secara online. Belajar skill baru sambil mengajarkan skill yang kamu kuasai kepada orang lain.

## 🚀 Demo & Features

### Fitur Utama
- **User System**: Register, Login, Profile Management
- **Skill Marketplace**: Post skill yang ditawarkan dan skill yang dicari
- **Smart Matching**: Sistem otomatis mencocokkan user berdasarkan skill
- **Exchange System**: Request dan kelola pertukaran skill
- **Chat Integration**: Komunikasi dengan partner skill exchange

### Tech Stack
- **Backend**: Go + Gin + GORM + PostgreSQL + JWT
- **Frontend**: React + Vite + Tailwind CSS + Redux Toolkit
- **Database**: PostgreSQL
- **Deployment**: Railway/Render (Backend) + Vercel (Frontend)

## 📂 Project Structure

```
SkillSwap/
├── backend/                 # Go API Server
│   ├── cmd/
│   │   └── main.go         # Application entry point
│   ├── config/             # Database & environment config
│   ├── controllers/        # HTTP request handlers
│   ├── middleware/         # JWT auth, CORS
│   ├── models/             # Database models
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic
│   ├── utils/              # Helper functions
│   ├── go.mod
│   └── README.md
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── features/       # Redux slices
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── utils/          # Utilities
│   ├── package.json
│   └── README.md
└── README.md              # This file
```

## 🛠️ Quick Start

### Prerequisites
- Go 1.21+
- Node.js 18+
- PostgreSQL
- Git

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   go mod tidy
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Create database**
   ```sql
   CREATE DATABASE skillswap_db;
   ```

5. **Run the server**
   ```bash
   go run cmd/main.go
   ```

Backend will start on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # VITE_API_URL=http://localhost:8080/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

Frontend will start on `http://localhost:3000`

## 🌐 API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
```

### Users
```
GET  /api/user/profile      # Get current user profile
PUT  /api/user/profile      # Update user profile
GET  /api/user/:id          # Get user by ID
```

### Skills
```
POST   /api/skills          # Create new skill
GET    /api/skills          # Get all skills (with filters)
GET    /api/skills/my       # Get current user's skills
GET    /api/skills/:id      # Get skill by ID
PUT    /api/skills/:id      # Update skill
DELETE /api/skills/:id      # Delete skill
```

### Exchanges
```
POST /api/exchanges         # Create exchange request
GET  /api/exchanges         # Get user's exchanges
GET  /api/exchanges/:id     # Get exchange by ID
PUT  /api/exchanges/:id/status # Update exchange status
```

### Matches
```
GET  /api/matches           # Get skill matches for current user
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar VARCHAR(255),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Skills Table
```sql
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL, -- beginner, intermediate, advanced, expert
    skill_type VARCHAR(50) NOT NULL, -- offering, seeking
    tags TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Exchanges Table
```sql
CREATE TABLE exchanges (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id),
    skill_id INTEGER REFERENCES skills(id),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, completed, cancelled
    response_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

## 🎯 Usage Examples

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

## 🚀 Deployment

### Backend (Railway/Render)

1. **Connect repository** to Railway/Render
2. **Set environment variables**:
   ```
   DB_HOST=your-postgres-host
   DB_PORT=5432
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=your-db-name
   JWT_SECRET=your-production-jwt-secret
   GIN_MODE=release
   ```
3. **Deploy** - automatic build and deployment

### Frontend (Vercel/Netlify)

1. **Connect repository** to Vercel/Netlify
2. **Set environment variables**:
   ```
   VITE_API_URL=https://your-backend-api.com/api
   ```
3. **Deploy** - automatic build and deployment

## 🔧 Development

### Backend Development
```bash
# Run with hot reload (install Air first)
go install github.com/cosmtrek/air@latest
air

# Run tests
go test ./...

# Build for production
go build -o bin/skillswap cmd/main.go
```

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 📝 API Documentation

Detailed API documentation is available in the backend README. Key features:

- **Authentication**: JWT-based with refresh tokens
- **Validation**: Request validation using go-playground/validator
- **Error Handling**: Consistent error response format
- **Pagination**: Built-in pagination for list endpoints
- **Filtering**: Advanced filtering for skills and matches

## 🎨 UI/UX Features

- **Modern Design**: Clean, modern interface with Tailwind CSS
- **Responsive**: Mobile-first responsive design
- **Interactive**: Real-time updates and smooth animations
- **Accessible**: ARIA labels and keyboard navigation
- **Dark Mode Ready**: Easy to implement dark mode support

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configurable CORS middleware
- **Input Validation**: Server-side and client-side validation
- **SQL Injection Protection**: GORM ORM prevents SQL injection

## 🧪 Testing

### Backend Testing
```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific test
go test ./controllers
```

### Frontend Testing
```bash
# Run unit tests (when implemented)
npm test

# Run e2e tests (when implemented)
npm run test:e2e
```

## 📈 Performance

- **Database Indexing**: Optimized database queries with proper indexing
- **API Caching**: Response caching for frequently accessed data
- **Frontend Optimization**: Code splitting and lazy loading
- **Image Optimization**: Automatic image compression and resizing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you need help or have questions:
- Create an issue in this repository
- Check the backend and frontend README files for detailed documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ User authentication system
- ✅ Skill management (CRUD)
- ✅ Basic matching algorithm
- ✅ Exchange request system

### Phase 2 (Next)
- 🔄 Real-time chat system
- 🔄 Rating and review system
- 🔄 Advanced matching algorithm
- 🔄 Email notifications

### Phase 3 (Future)
- 📅 Calendar integration
- 🎥 Video call integration (WebRTC)
- 📱 Mobile app (React Native)
- 🌍 Multi-language support

### Phase 4 (Long-term)
- 🤖 AI-powered skill recommendations
- 🏆 Gamification system
- 📊 Analytics dashboard
- 🔗 Social media integration

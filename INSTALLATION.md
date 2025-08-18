# SkillSwap - Menjalankan Aplikasi

## Instalasi Berhasil! ✅

Semua dependency telah berhasil diinstall untuk:
- **Backend**: Go + Gin + GORM + PostgreSQL
- **Frontend**: React + Vite + Tailwind CSS + Redux

## Langkah Selanjutnya:

### 1. Setup Database PostgreSQL
Buat database PostgreSQL terlebih dahulu:
```sql
CREATE DATABASE skillswap_db;
```

### 2. Konfigurasi Environment Variables

**Backend (.env):**
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=skillswap_db
DB_SSLMODE=disable
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=8080
GIN_MODE=debug
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:8080/api
```

### 3. Menjalankan Aplikasi

**Terminal 1 - Backend:**
```powershell
cd backend
go run cmd/main.go
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### 4. Akses Aplikasi
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/health

## Status Instalasi ✅

- ✅ Go dependencies installed
- ✅ Node.js dependencies installed  
- ✅ Environment files created
- ✅ Frontend build test passed
- ✅ Backend compilation test passed

## Struktur Project:
```
SkillSwap/
├── backend/          # Go API (Port 8080)
├── frontend/         # React App (Port 3000)
└── INSTALLATION.md   # File ini
```

Selamat! Project SkillSwap siap untuk dijalankan! 🎉

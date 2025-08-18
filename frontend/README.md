# SkillSwap Frontend

Modern React frontend for SkillSwap platform built with Vite, Tailwind CSS, and shadcn/ui components.

## Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Redux Toolkit
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Recharts

## Features

- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 🔐 JWT Authentication
- 📱 Responsive design
- 🎯 Skill marketplace
- 🤝 Smart matching system
- 💬 Exchange management
- 👤 Profile management
- 📊 Dashboard with statistics

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Backend API running on port 8080

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   VITE_API_URL=http://localhost:8080/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The application will start on `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   └── Navbar.jsx     # Navigation component
│   ├── features/          # Redux slices
│   │   ├── store.js       # Redux store
│   │   ├── authSlice.js   # Authentication state
│   │   └── skillSlice.js  # Skills and matches state
│   ├── pages/             # Page components
│   │   ├── Home.jsx       # Landing page
│   │   ├── Login.jsx      # Login page
│   │   ├── Register.jsx   # Registration page
│   │   ├── Dashboard.jsx  # User dashboard
│   │   ├── Skills.jsx     # Skills management
│   │   ├── Matches.jsx    # Skill matches
│   │   ├── Exchanges.jsx  # Exchange requests
│   │   └── Profile.jsx    # User profile
│   ├── services/          # API services
│   │   └── api.js         # Axios configuration
│   ├── utils/             # Utility functions
│   │   └── cn.js          # Class name utility
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # App entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind configuration
├── vite.config.js        # Vite configuration
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Features

### Authentication
- User registration and login
- JWT token management
- Protected routes
- Automatic logout on token expiry

### Dashboard
- Quick statistics overview
- Recent skills and matches
- Quick action buttons
- Activity summary

### Skills Management
- Add/edit/delete skills
- Categorize as "offering" or "seeking"
- Skill levels and tags
- Real-time validation

### Smart Matching
- AI-powered skill matching
- Compatibility scores
- Mutual skill exchange detection
- Filter and search capabilities

### Exchange System
- Send/receive exchange requests
- Status tracking (pending, accepted, rejected)
- Communication management
- Exchange history

### Profile Management
- Update personal information
- Avatar and bio management
- Account settings
- Privacy controls

## UI Components

Built with shadcn/ui for consistent design:

- **Button** - Various styles and sizes
- **Card** - Content containers
- **Input** - Form inputs with icons
- **Label** - Form labels
- **Textarea** - Multi-line text input
- **Toast** - Notifications system

## State Management

Redux Toolkit is used for state management:

```javascript
// Store structure
{
  auth: {
    user: null | User,
    token: null | string,
    loading: boolean,
    error: string | null
  },
  skills: {
    skills: Skill[],
    userSkills: Skill[],
    matches: Match[],
    loading: boolean,
    error: string | null
  }
}
```

## API Integration

All API calls are handled through Axios with:
- Automatic token inclusion
- Response interceptors
- Error handling
- Base URL configuration

## Styling

### Tailwind CSS Classes
- **Spacing**: `p-4`, `m-2`, `space-y-4`
- **Layout**: `flex`, `grid`, `container`
- **Typography**: `text-lg`, `font-bold`
- **Colors**: `text-primary`, `bg-secondary`

### Custom CSS Variables
Defined in `index.css` for consistent theming:
- Primary colors
- Background colors
- Border radius
- Shadows

## Responsive Design

The application is fully responsive:
- **Mobile First**: Designed for mobile, enhanced for desktop
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Grid System**: CSS Grid and Flexbox
- **Navigation**: Collapsible mobile menu

## Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Bundle Analysis**: Vite bundle analyzer

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Set environment variables**:
   ```
   VITE_API_URL=https://your-backend-api.com/api
   ```
3. **Deploy** - automatic build and deployment

### Netlify

1. **Build command**: `npm run build`
2. **Publish directory**: `dist`
3. **Environment variables**: Set `VITE_API_URL`

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## Environment Variables

- `VITE_API_URL` - Backend API base URL

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend is running
   - Verify VITE_API_URL in .env
   - Check CORS settings

2. **Build Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version (18+)

3. **Styling Issues**
   - Ensure Tailwind is configured correctly
   - Check PostCSS configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../features/authSlice'
import { Button } from './ui/button'
import { 
  User, 
  LogOut, 
  Home, 
  BookOpen, 
  Users, 
  MessageSquare,
  Menu
} from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
  const { user, token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  return (
    <nav className="bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold">
            SkillSwap
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {token ? (
              <>
                <Link to="/dashboard" className="flex items-center space-x-1 hover:text-primary-foreground/80">
                  <Home size={16} />
                  <span>Dashboard</span>
                </Link>
                <Link to="/skills" className="flex items-center space-x-1 hover:text-primary-foreground/80">
                  <BookOpen size={16} />
                  <span>Skills</span>
                </Link>
                <Link to="/matches" className="flex items-center space-x-1 hover:text-primary-foreground/80">
                  <Users size={16} />
                  <span>Matches</span>
                </Link>
                <Link to="/exchanges" className="flex items-center space-x-1 hover:text-primary-foreground/80">
                  <MessageSquare size={16} />
                  <span>Exchanges</span>
                </Link>
                <Link to="/chat" className="flex items-center space-x-1 hover:text-primary-foreground/80">
                  <MessageSquare size={16} />
                  <span>Chat</span>
                </Link>
                <Link to="/profile" className="flex items-center space-x-1 hover:text-primary-foreground/80">
                  <User size={16} />
                  <span>{user?.full_name || 'Profile'}</span>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-primary border-primary-foreground"
                >
                  <LogOut size={16} />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="text-primary border-primary-foreground">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary" size="sm">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            {token ? (
              <div className="flex flex-col space-y-2">
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-2 py-2 hover:text-primary-foreground/80"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home size={16} />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  to="/skills" 
                  className="flex items-center space-x-2 py-2 hover:text-primary-foreground/80"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BookOpen size={16} />
                  <span>Skills</span>
                </Link>
                <Link 
                  to="/matches" 
                  className="flex items-center space-x-2 py-2 hover:text-primary-foreground/80"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users size={16} />
                  <span>Matches</span>
                </Link>
                <Link 
                  to="/exchanges" 
                  className="flex items-center space-x-2 py-2 hover:text-primary-foreground/80"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare size={16} />
                  <span>Exchanges</span>
                </Link>
                <Link 
                  to="/chat" 
                  className="flex items-center space-x-2 py-2 hover:text-primary-foreground/80"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare size={16} />
                  <span>Chat</span>
                </Link>
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-2 py-2 hover:text-primary-foreground/80"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={16} />
                  <span>Profile</span>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-primary border-primary-foreground w-fit"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="text-primary border-primary-foreground">
                    Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="secondary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { ArrowRight, Users, BookOpen, MessageSquare, Star } from 'lucide-react'

const Home = () => {
  const { token } = useSelector((state) => state.auth)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-20">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          SkillSwap
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Platform tukar keterampilan online terbesar di Indonesia. Belajar skill baru sambil mengajarkan skill yang kamu kuasai.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!token ? (
            <>
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Mulai Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Masuk
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/dashboard">
              <Button size="lg">
                Ke Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Fitur Utama</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <BookOpen className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Skill Marketplace</CardTitle>
              <CardDescription>
                Posting skill yang kamu tawarkan atau cari skill yang ingin dipelajari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Kategori skill lengkap</li>
                <li>• Level difficulty</li>
                <li>• Sistem rating & review</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Smart Matching</CardTitle>
              <CardDescription>
                Sistem otomatis mencocokkan user berdasarkan skill yang saling dibutuhkan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AI-powered matching</li>
                <li>• Mutual skill exchange</li>
                <li>• Compatibility score</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Exchange System</CardTitle>
              <CardDescription>
                Kelola permintaan tukar skill dan komunikasi dengan partner belajar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Request management</li>
                <li>• Chat integration</li>
                <li>• Status tracking</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-muted/50 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">Cara Kerja</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold mb-2">Daftar & Setup Profile</h3>
            <p className="text-sm text-muted-foreground">Buat akun dan lengkapi profil dengan skill yang kamu miliki</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold mb-2">Post Skills</h3>
            <p className="text-sm text-muted-foreground">Tambahkan skill yang kamu tawarkan dan skill yang ingin dipelajari</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold mb-2">Find Matches</h3>
            <p className="text-sm text-muted-foreground">Sistem akan mencarikan partner yang cocok untuk tukar skill</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              4
            </div>
            <h3 className="font-semibold mb-2">Start Learning</h3>
            <p className="text-sm text-muted-foreground">Mulai belajar dan mengajar dengan partner yang telah matched</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">1000+</div>
            <div className="text-muted-foreground">Active Users</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-muted-foreground">Skills Available</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">98%</div>
            <div className="text-muted-foreground">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

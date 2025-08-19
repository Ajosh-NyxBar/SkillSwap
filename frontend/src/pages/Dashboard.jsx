import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUserSkills, fetchMatches } from '../features/skillSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  TrendingUp,
  Plus,
  Target,
  Award
} from 'lucide-react'

const Dashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { userSkills, matches } = useSelector((state) => state.skills)

  useEffect(() => {
    dispatch(fetchUserSkills())
    dispatch(fetchMatches())
  }, [dispatch])

  const offeringSkills = (userSkills || []).filter(skill => skill.skill_type === 'offering')
  const seekingSkills = (userSkills || []).filter(skill => skill.skill_type === 'seeking')

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.full_name || 'User'}! 👋
        </h1>
        <p className="text-muted-foreground">
          Ready to learn something new or share your expertise?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Offered</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offeringSkills.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Seeking</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seekingSkills.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Matches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(matches || []).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exchange Success</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/skills">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center p-6">
              <Plus className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Add Skill</h3>
              <p className="text-sm text-muted-foreground text-center">
                Share your expertise or find new skills to learn
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/matches">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center p-6">
              <Users className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Find Matches</h3>
              <p className="text-sm text-muted-foreground text-center">
                Discover people who share complementary skills
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/exchanges">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center p-6">
              <MessageSquare className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Exchanges</h3>
              <p className="text-sm text-muted-foreground text-center">
                Manage your skill exchange requests
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/profile">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center p-6">
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Profile</h3>
              <p className="text-sm text-muted-foreground text-center">
                Update your profile and preferences
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Skills */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Your Skills Offered
            </CardTitle>
            <CardDescription>
              Skills you're teaching or mentoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            {offeringSkills.length > 0 ? (
              <div className="space-y-3">
                {offeringSkills.slice(0, 3).map((skill) => (
                  <div key={skill.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{skill.title}</h4>
                      <p className="text-sm text-muted-foreground">{skill.category} • {skill.level}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      skill.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {skill.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
                {offeringSkills.length > 3 && (
                  <Link to="/skills">
                    <Button variant="outline" size="sm" className="w-full">
                      View All ({offeringSkills.length - 3} more)
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground mb-4">No skills offered yet</p>
                <Link to="/skills">
                  <Button>Add Your First Skill</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Skills You're Seeking
            </CardTitle>
            <CardDescription>
              Skills you want to learn
            </CardDescription>
          </CardHeader>
          <CardContent>
            {seekingSkills.length > 0 ? (
              <div className="space-y-3">
                {seekingSkills.slice(0, 3).map((skill) => (
                  <div key={skill.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{skill.title}</h4>
                      <p className="text-sm text-muted-foreground">{skill.category} • {skill.level}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      skill.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {skill.is_active ? 'Searching' : 'Paused'}
                    </span>
                  </div>
                ))}
                {seekingSkills.length > 3 && (
                  <Link to="/skills">
                    <Button variant="outline" size="sm" className="w-full">
                      View All ({seekingSkills.length - 3} more)
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground mb-4">No skills being sought yet</p>
                <Link to="/skills">
                  <Button>Add Learning Goals</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Matches */}
      {(matches || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Matches
            </CardTitle>
            <CardDescription>
              People who might be perfect skill exchange partners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(matches || []).slice(0, 3).map((match) => (
                <div key={`${match.user_id}-${match.offered_skill_id}`} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {match.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium">{match.user_name}</h4>
                      <p className="text-sm text-green-600">Match Score: {match.match_score}%</p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p><span className="font-medium">Offers:</span> {match.offered_skill}</p>
                    <p><span className="font-medium">You seek:</span> {match.seeking_skill}</p>
                  </div>
                </div>
              ))}
            </div>
            {(matches || []).length > 3 && (
              <Link to="/matches">
                <Button variant="outline" className="w-full mt-4">
                  View All Matches ({(matches || []).length - 3} more)
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Dashboard

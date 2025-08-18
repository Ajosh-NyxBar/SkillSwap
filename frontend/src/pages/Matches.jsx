import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMatches } from '../features/skillSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Users, Star, MessageCircle, Loader2 } from 'lucide-react'

const Matches = () => {
  const dispatch = useDispatch()
  const { matches, loading } = useSelector((state) => state.skills)

  useEffect(() => {
    dispatch(fetchMatches())
  }, [dispatch])

  const handleStartExchange = (match) => {
    // This would open a modal or navigate to exchange creation
    console.log('Starting exchange with:', match)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Skill Matches</h1>
        <p className="text-muted-foreground">
          People who might be perfect skill exchange partners for you
        </p>
      </div>

      {/* Matches Grid */}
      {matches.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <Card key={`${match.user_id}-${match.offered_skill_id}`} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {match.user_avatar ? (
                        <img 
                          src={match.user_avatar} 
                          alt={match.user_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold">
                          {match.user_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{match.user_name}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-green-600">
                          {match.match_score}% Match
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Skills Exchange Info */}
                <div className="space-y-2">
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm font-medium text-green-800">They can teach:</p>
                    <p className="text-green-700">{match.offered_skill}</p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-blue-800">You want to learn:</p>
                    <p className="text-blue-700">{match.seeking_skill}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleStartExchange(match)}
                    className="flex-1"
                    size="sm"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Exchange
                  </Button>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Matches Found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We couldn't find any skill matches for you right now. Try adding more skills to your profile to increase your chances of finding great matches!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => window.location.href = '/skills'}>
                Add More Skills
              </Button>
              <Button variant="outline" onClick={() => dispatch(fetchMatches())}>
                Refresh Matches
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Tips for Better Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Improve Your Profile:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Add detailed descriptions to your skills</li>
                <li>• Include relevant tags and keywords</li>
                <li>• Update your bio and location</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Expand Your Skills:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Add both offering and seeking skills</li>
                <li>• Be specific about skill levels</li>
                <li>• Include diverse skill categories</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Matches

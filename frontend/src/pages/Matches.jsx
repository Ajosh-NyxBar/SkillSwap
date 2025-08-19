import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchMatches, fetchUserSkills } from '../features/skillSlice'
import { createChatRoom } from '../features/chatSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Users, Star, MessageCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useToast } from '../components/ui/toaster'

const Matches = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { matches, loading, error, userSkills } = useSelector((state) => state.skills)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    dispatch(fetchMatches())
    dispatch(fetchUserSkills()) // Also fetch user skills to check prerequisites
  }, [dispatch])

  const handleRefreshMatches = async () => {
    setRefreshing(true)
    try {
      await dispatch(fetchMatches()).unwrap()
      toast({
        title: "Success",
        description: "Matches refreshed successfully!",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh matches",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleStartExchange = (match) => {
    // This would open a modal or navigate to exchange creation
    console.log('Starting exchange with:', match)
  }

  const handleStartChat = async (match) => {
    try {
      await dispatch(createChatRoom({ other_user_id: match.user_id })).unwrap()
      navigate('/chat')
      toast({
        title: "Success",
        description: "Chat started successfully!",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error || "Failed to start chat",
      })
    }
  }

  const seekingSkills = userSkills.filter(skill => skill.skill_type === 'seeking')
  const offeringSkills = userSkills.filter(skill => skill.skill_type === 'offering')

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Finding your perfect matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Skill Matches</h1>
          <p className="text-muted-foreground">
            People who might be perfect skill exchange partners for you
          </p>
        </div>
        <Button 
          onClick={handleRefreshMatches}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Matches</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefreshMatches}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Prerequisites Check */}
      {!loading && !error && seekingSkills.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Skills to Match</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              To find matches, you need to add skills you want to learn. Add some "seeking" skills to your profile first!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => window.location.href = '/skills'}>
                Add Skills You Want to Learn
              </Button>
              <Button variant="outline" onClick={handleRefreshMatches}>
                Refresh Matches
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Matching Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>🎯 Skills you're seeking: <strong>{seekingSkills.length}</strong></p>
            <p>📚 Skills you're offering: <strong>{offeringSkills.length}</strong></p>
            <p>🔍 Matches found: <strong>{(matches || []).length}</strong></p>
            {seekingSkills.length > 0 && (
              <div className="mt-4">
                <p className="font-medium mb-2">You're looking for:</p>
                <div className="flex flex-wrap gap-2">
                  {seekingSkills.slice(0, 5).map((skill) => (
                    <span 
                      key={skill.id}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {skill.title}
                    </span>
                  ))}
                  {seekingSkills.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{seekingSkills.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Matches Grid */}
      {!loading && !error && seekingSkills.length > 0 && (
        <>
          {(matches || []).length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(matches || []).map((match) => (
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
                        onClick={() => handleStartChat(match)}
                        className="flex-1"
                        size="sm"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Start Chat
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStartExchange(match)}
                      >
                        Exchange
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
                <h3 className="text-lg font-semibold mb-2">No Matches Found Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We couldn't find any skill matches for you right now. This could be because:
                </p>
                <div className="text-left max-w-md mx-auto mb-6">
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• No other users are offering the skills you're seeking</li>
                    <li>• Your skill descriptions are too specific</li>
                    <li>• No users match your skill level requirements</li>
                    <li>• There are simply not enough users yet</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => window.location.href = '/skills'}>
                    Add More Skills
                  </Button>
                  <Button variant="outline" onClick={handleRefreshMatches}>
                    Refresh Matches
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
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

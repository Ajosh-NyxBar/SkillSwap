import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUserRating, fetchUserReviews } from '../features/reviewSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Star, StarOff, User, Calendar, MessageSquare } from 'lucide-react'

const UserRating = ({ userId, showReviews = true, compact = false }) => {
  const dispatch = useDispatch()
  const { userRating, userReviews, loading } = useSelector((state) => state.reviews)
  const [showAllReviews, setShowAllReviews] = useState(false)

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserRating(userId))
      if (showReviews) {
        dispatch(fetchUserReviews({ userId, page: 1, limit: 5 }))
      }
    }
  }, [dispatch, userId, showReviews])

  const renderStarRating = (rating, size = 'md') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= Math.floor(rating) ? (
              <Star className={`${sizeClass} fill-yellow-400 text-yellow-400`} />
            ) : star === Math.ceil(rating) && rating % 1 !== 0 ? (
              <div className="relative">
                <StarOff className={`${sizeClass} text-gray-300`} />
                <Star 
                  className={`${sizeClass} fill-yellow-400 text-yellow-400 absolute top-0 left-0`}
                  style={{ clipPath: `inset(0 ${100 - (rating % 1) * 100}% 0 0)` }}
                />
              </div>
            ) : (
              <StarOff className={`${sizeClass} text-gray-300`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-24"></div>
      </div>
    )
  }

  if (!userRating || userRating.total_reviews === 0) {
    return (
      <div className={compact ? "text-sm text-muted-foreground" : ""}>
        {compact ? "No reviews yet" : (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-muted-foreground">
                No reviews yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {renderStarRating(userRating.average_rating, 'sm')}
        <span className="text-sm font-medium">
          {userRating.average_rating.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">
          ({userRating.total_reviews} {userRating.total_reviews === 1 ? 'review' : 'reviews'})
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Rating Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {userRating.average_rating.toFixed(1)}
              </div>
              {renderStarRating(userRating.average_rating)}
              <div className="text-sm text-muted-foreground mt-1">
                {userRating.total_reviews} {userRating.total_reviews === 1 ? 'review' : 'reviews'}
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = userRating[`rating_${stars}_count`] || 0
                const percentage = userRating.total_reviews > 0 
                  ? (count / userRating.total_reviews) * 100 
                  : 0
                
                return (
                  <div key={stars} className="flex items-center space-x-2 text-sm">
                    <span className="w-3">{stars}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      {showReviews && userReviews && userReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Reviews
            </CardTitle>
            <CardDescription>
              What others are saying
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userReviews.slice(0, showAllReviews ? userReviews.length : 3).map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {review.reviewer?.full_name || 'Anonymous'}
                        </div>
                        <div className="flex items-center space-x-1">
                          {renderStarRating(review.rating, 'sm')}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                  
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mb-2">
                      "{review.comment}"
                    </p>
                  )}
                  
                  {review.tags && (
                    <div className="flex flex-wrap gap-1">
                      {review.tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {userReviews.length > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="w-full"
                >
                  {showAllReviews ? 'Show Less' : `Show All ${userReviews.length} Reviews`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default UserRating

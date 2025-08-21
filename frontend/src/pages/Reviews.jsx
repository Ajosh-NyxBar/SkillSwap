import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  fetchMyReviews, 
  fetchPendingReviews, 
  createReview, 
  updateReview, 
  deleteReview,
  clearError 
} from '../features/reviewSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { useToast } from '../components/ui/toaster'
import { 
  Star, 
  StarOff, 
  MessageSquare, 
  Calendar, 
  User, 
  Edit, 
  Trash2, 
  Plus,
  Clock,
  CheckCircle
} from 'lucide-react'

const Reviews = () => {
  const dispatch = useDispatch()
  const { myReviews, pendingReviews, loading, error } = useSelector((state) => state.reviews)
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('pending')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [selectedExchange, setSelectedExchange] = useState(null)
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    tags: ''
  })

  useEffect(() => {
    dispatch(fetchPendingReviews())
    dispatch(fetchMyReviews({ page: 1, limit: 10 }))
  }, [dispatch])

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
      dispatch(clearError())
    }
  }, [error, toast, dispatch])

  const handleCreateReview = (exchange) => {
    setSelectedExchange(exchange)
    setShowCreateForm(true)
    setFormData({
      rating: 5,
      comment: '',
      tags: ''
    })
  }

  const handleEditReview = (review) => {
    setEditingReview(review)
    setFormData({
      rating: review.rating,
      comment: review.comment,
      tags: review.tags
    })
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    
    if (editingReview) {
      // Update existing review
      const result = await dispatch(updateReview({
        reviewId: editingReview.id,
        reviewData: formData
      }))
      
      if (result.type === 'reviews/updateReview/fulfilled') {
        toast({
          title: "Success",
          description: "Review updated successfully",
        })
        setEditingReview(null)
      }
    } else {
      // Create new review
      const result = await dispatch(createReview({
        exchange_id: selectedExchange.id,
        ...formData
      }))
      
      if (result.type === 'reviews/createReview/fulfilled') {
        toast({
          title: "Success",
          description: "Review created successfully",
        })
        setShowCreateForm(false)
        setSelectedExchange(null)
      }
    }
    
    // Reset form
    setFormData({
      rating: 5,
      comment: '',
      tags: ''
    })
  }

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      const result = await dispatch(deleteReview(reviewId))
      
      if (result.type === 'reviews/deleteReview/fulfilled') {
        toast({
          title: "Success",
          description: "Review deleted successfully",
        })
      }
    }
  }

  const renderStarRating = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onChange(star) : undefined}
            className={interactive ? "hover:scale-110 transition-transform" : ""}
            disabled={!interactive}
          >
            {star <= rating ? (
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-5 w-5 text-gray-300" />
            )}
          </button>
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

  const getOtherUserInfo = (exchange) => {
    // Assuming current user info is available in auth state
    const currentUserId = useSelector((state) => state.auth.user?.id)
    
    if (exchange.requester_id === currentUserId) {
      return {
        name: exchange.skill?.user?.full_name || 'Unknown',
        role: 'Skill Provider'
      }
    } else {
      return {
        name: exchange.requester?.full_name || 'Unknown',
        role: 'Skill Seeker'
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reviews & Ratings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your reviews and rate your skill exchange experiences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pending')}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Pending Reviews ({pendingReviews.length})
        </Button>
        <Button
          variant={activeTab === 'my-reviews' ? 'default' : 'outline'}
          onClick={() => setActiveTab('my-reviews')}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          My Reviews ({myReviews.length})
        </Button>
      </div>

      {/* Pending Reviews Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Reviews
              </CardTitle>
              <CardDescription>
                Completed exchanges waiting for your review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending reviews. Complete some exchanges to leave reviews!
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingReviews.map((exchange) => {
                    const otherUser = getOtherUserInfo(exchange)
                    return (
                      <div key={exchange.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{otherUser.name}</span>
                              <span className="text-sm text-muted-foreground">({otherUser.role})</span>
                            </div>
                            <p className="text-sm mb-2">
                              <span className="font-medium">Skill:</span> {exchange.skill?.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Completed on {formatDate(exchange.updated_at)}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleCreateReview(exchange)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Write Review
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* My Reviews Tab */}
      {activeTab === 'my-reviews' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                My Reviews
              </CardTitle>
              <CardDescription>
                Reviews you've written for other users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myReviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  You haven't written any reviews yet
                </p>
              ) : (
                <div className="space-y-4">
                  {myReviews.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{review.reviewee?.full_name}</span>
                          </div>
                          {renderStarRating(review.rating)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditReview(review)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {review.comment && (
                        <p className="text-sm mb-2">{review.comment}</p>
                      )}
                      
                      {review.tags && (
                        <div className="flex flex-wrap gap-1 mb-2">
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
                      
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Review Modal */}
      {(showCreateForm || editingReview) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingReview ? 'Edit Review' : 'Write Review'}
              </CardTitle>
              <CardDescription>
                {editingReview 
                  ? 'Update your review' 
                  : `Rate your experience with ${getOtherUserInfo(selectedExchange)?.name}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <Label>Rating</Label>
                  {renderStarRating(
                    formData.rating, 
                    true, 
                    (rating) => setFormData({ ...formData, rating })
                  )}
                </div>

                <div>
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    placeholder="Share your experience..."
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="helpful, patient, knowledgeable"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingReview(null)
                      setSelectedExchange(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {editingReview ? 'Update' : 'Submit'} Review
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Reviews

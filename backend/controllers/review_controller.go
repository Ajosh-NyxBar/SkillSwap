package controllers

import (
	"net/http"
	"skillswap-backend/config"
	"skillswap-backend/models"
	"skillswap-backend/services"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ReviewController struct{}

type CreateReviewRequest struct {
	ExchangeID uint   `json:"exchange_id" validate:"required"`
	Rating     int    `json:"rating" validate:"required,min=1,max=5"`
	Comment    string `json:"comment"`
	Tags       string `json:"tags"`
}

type UpdateReviewRequest struct {
	Rating  int    `json:"rating" validate:"required,min=1,max=5"`
	Comment string `json:"comment"`
	Tags    string `json:"tags"`
}

// CreateReview creates a new review for a completed exchange
func (rc *ReviewController) CreateReview(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get the exchange and verify it's completed
	var exchange models.Exchange
	if err := config.DB.Preload("Skill").First(&exchange, req.ExchangeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Exchange not found"})
		return
	}

	// Verify exchange is completed
	if exchange.Status != "completed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Can only review completed exchanges"})
		return
	}

	// Verify user is part of this exchange
	currentUserID := userID.(uint)
	if exchange.RequesterID != currentUserID && exchange.Skill.UserID != currentUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only review exchanges you're part of"})
		return
	}

	// Check if review already exists
	var existingReview models.Review
	if err := config.DB.Where("exchange_id = ? AND reviewer_id = ?", req.ExchangeID, currentUserID).First(&existingReview).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already reviewed this exchange"})
		return
	}

	// Determine reviewee (the other person in the exchange)
	var revieweeID uint
	if exchange.RequesterID == currentUserID {
		revieweeID = exchange.Skill.UserID
	} else {
		revieweeID = exchange.RequesterID
	}

	// Create review
	review := models.Review{
		ExchangeID: req.ExchangeID,
		ReviewerID: currentUserID,
		RevieweeID: revieweeID,
		Rating:     req.Rating,
		Comment:    req.Comment,
		Tags:       req.Tags,
	}

	if err := config.DB.Create(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	// Update user rating statistics
	go rc.updateUserRating(revieweeID)

	// Send email notification to reviewee
	go func() {
		emailService := &services.EmailService{}
		emailService.SendNewReviewNotification(review)
	}()

	// Load relationships
	config.DB.Preload("Exchange").Preload("Reviewer").Preload("Reviewee").First(&review, review.ID)

	c.JSON(http.StatusCreated, review)
}

// GetReviews gets reviews for a user (received reviews)
func (rc *ReviewController) GetReviews(c *gin.Context) {
	userIDStr := c.Param("userId")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var reviews []models.Review
	var total int64

	query := config.DB.Where("reviewee_id = ?", userID)

	// Get total count
	query.Model(&models.Review{}).Count(&total)

	// Get paginated results
	if err := query.Preload("Reviewer").Preload("Exchange").Preload("Exchange.Skill").
		Limit(limit).Offset(offset).Order("created_at DESC").Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	response := gin.H{
		"reviews": reviews,
		"pagination": gin.H{
			"current_page": page,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
			"total_items":  total,
			"per_page":     limit,
		},
	}

	c.JSON(http.StatusOK, response)
}

// GetMyReviews gets reviews written by the current user
func (rc *ReviewController) GetMyReviews(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var reviews []models.Review
	var total int64

	query := config.DB.Where("reviewer_id = ?", userID)

	// Get total count
	query.Model(&models.Review{}).Count(&total)

	// Get paginated results
	if err := query.Preload("Reviewee").Preload("Exchange").Preload("Exchange.Skill").
		Limit(limit).Offset(offset).Order("created_at DESC").Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	response := gin.H{
		"reviews": reviews,
		"pagination": gin.H{
			"current_page": page,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
			"total_items":  total,
			"per_page":     limit,
		},
	}

	c.JSON(http.StatusOK, response)
}

// GetReviewByID gets a specific review
func (rc *ReviewController) GetReviewByID(c *gin.Context) {
	reviewIDStr := c.Param("id")
	reviewID, err := strconv.ParseUint(reviewIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	var review models.Review
	if err := config.DB.Preload("Exchange").Preload("Reviewer").Preload("Reviewee").
		First(&review, uint(reviewID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	c.JSON(http.StatusOK, review)
}

// UpdateReview updates an existing review
func (rc *ReviewController) UpdateReview(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	reviewIDStr := c.Param("id")
	reviewID, err := strconv.ParseUint(reviewIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	var review models.Review
	if err := config.DB.First(&review, uint(reviewID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	// Check if the user owns this review
	if review.ReviewerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own reviews"})
		return
	}

	var req UpdateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update review fields
	oldRating := review.Rating
	review.Rating = req.Rating
	review.Comment = req.Comment
	review.Tags = req.Tags

	if err := config.DB.Save(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update review"})
		return
	}

	// Update user rating statistics if rating changed
	if oldRating != req.Rating {
		go rc.updateUserRating(review.RevieweeID)
	}

	// Load relationships
	config.DB.Preload("Exchange").Preload("Reviewer").Preload("Reviewee").First(&review, review.ID)

	c.JSON(http.StatusOK, review)
}

// DeleteReview deletes a review
func (rc *ReviewController) DeleteReview(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	reviewIDStr := c.Param("id")
	reviewID, err := strconv.ParseUint(reviewIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	var review models.Review
	if err := config.DB.First(&review, uint(reviewID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	// Check if the user owns this review
	if review.ReviewerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own reviews"})
		return
	}

	revieweeID := review.RevieweeID

	if err := config.DB.Delete(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete review"})
		return
	}

	// Update user rating statistics
	go rc.updateUserRating(revieweeID)

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted successfully"})
}

// GetUserRating gets aggregated rating data for a user
func (rc *ReviewController) GetUserRating(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var userRating models.UserRating
	if err := config.DB.Where("user_id = ?", userID).First(&userRating).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Return default rating if no reviews exist
			c.JSON(http.StatusOK, gin.H{
				"user_id":        userID,
				"average_rating": 0,
				"total_reviews":  0,
				"rating_1_count": 0,
				"rating_2_count": 0,
				"rating_3_count": 0,
				"rating_4_count": 0,
				"rating_5_count": 0,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user rating"})
		return
	}

	c.JSON(http.StatusOK, userRating)
}

// GetPendingReviews gets exchanges that can be reviewed by the current user
func (rc *ReviewController) GetPendingReviews(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get completed exchanges where user hasn't written a review yet
	var exchanges []models.Exchange
	err := config.DB.
		Preload("Skill").
		Preload("Skill.User").
		Preload("Requester").
		Where("status = 'completed' AND (requester_id = ? OR skill_id IN (SELECT id FROM skills WHERE user_id = ?))", userID, userID).
		Where("id NOT IN (SELECT exchange_id FROM reviews WHERE reviewer_id = ?)", userID).
		Order("updated_at DESC").
		Find(&exchanges).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pending reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"exchanges": exchanges})
}

// updateUserRating recalculates and updates user rating statistics
func (rc *ReviewController) updateUserRating(userID uint) {
	var reviews []models.Review
	config.DB.Where("reviewee_id = ?", userID).Find(&reviews)

	if len(reviews) == 0 {
		// Delete user rating if no reviews exist
		config.DB.Where("user_id = ?", userID).Delete(&models.UserRating{})
		return
	}

	var totalRating int
	var counts [6]int // index 0 unused, 1-5 for ratings

	for _, review := range reviews {
		totalRating += review.Rating
		counts[review.Rating]++
	}

	averageRating := float64(totalRating) / float64(len(reviews))

	userRating := models.UserRating{
		UserID:        userID,
		AverageRating: averageRating,
		TotalReviews:  len(reviews),
		Rating1Count:  counts[1],
		Rating2Count:  counts[2],
		Rating3Count:  counts[3],
		Rating4Count:  counts[4],
		Rating5Count:  counts[5],
	}

	// Upsert user rating
	config.DB.Where("user_id = ?", userID).Assign(userRating).FirstOrCreate(&userRating)
}

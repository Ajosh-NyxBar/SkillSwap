package controllers

import (
	"net/http"
	"skillswap-backend/config"
	"skillswap-backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ExchangeController struct{}

type CreateExchangeRequest struct {
	SkillID uint   `json:"skill_id" validate:"required"`
	Message string `json:"message"`
}

type UpdateExchangeStatusRequest struct {
	Status       string `json:"status" validate:"required,oneof=accepted rejected completed cancelled"`
	ResponseText string `json:"response_text"`
}

func (ec *ExchangeController) CreateExchange(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req CreateExchangeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if skill exists
	var skill models.Skill
	if err := config.DB.First(&skill, req.SkillID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Skill not found"})
		return
	}

	// Check if user is trying to exchange with their own skill
	if skill.UserID == userID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot exchange with your own skill"})
		return
	}

	// Check if exchange already exists
	var existingExchange models.Exchange
	if err := config.DB.Where("requester_id = ? AND skill_id = ? AND status IN ?", userID, req.SkillID, []string{"pending", "accepted"}).First(&existingExchange).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Exchange request already exists"})
		return
	}

	exchange := models.Exchange{
		RequesterID: userID.(uint),
		SkillID:     req.SkillID,
		Message:     req.Message,
		Status:      "pending",
	}

	if err := config.DB.Create(&exchange).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create exchange request"})
		return
	}

	// Load relationships
	config.DB.Preload("Requester").Preload("Skill").Preload("Skill.User").First(&exchange, exchange.ID)

	c.JSON(http.StatusCreated, exchange)
}

func (ec *ExchangeController) GetExchanges(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	exchangeType := c.Query("type") // "sent" or "received"

	var exchanges []models.Exchange
	query := config.DB.Preload("Requester").Preload("Skill").Preload("Skill.User")

	if exchangeType == "sent" {
		// Exchanges sent by the current user
		query = query.Where("requester_id = ?", userID)
	} else if exchangeType == "received" {
		// Exchanges received by the current user (for their skills)
		query = query.Joins("JOIN skills ON exchanges.skill_id = skills.id").Where("skills.user_id = ?", userID)
	} else {
		// All exchanges related to the user
		query = query.Where("requester_id = ? OR EXISTS (SELECT 1 FROM skills WHERE skills.id = exchanges.skill_id AND skills.user_id = ?)", userID, userID)
	}

	if err := query.Order("created_at DESC").Find(&exchanges).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch exchanges"})
		return
	}

	c.JSON(http.StatusOK, exchanges)
}

func (ec *ExchangeController) GetExchangeByID(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	exchangeIDStr := c.Param("id")
	exchangeID, err := strconv.ParseUint(exchangeIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid exchange ID"})
		return
	}

	var exchange models.Exchange
	if err := config.DB.Preload("Requester").Preload("Skill").Preload("Skill.User").First(&exchange, uint(exchangeID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Exchange not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Check if user is involved in this exchange
	if exchange.RequesterID != userID.(uint) && exchange.Skill.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this exchange"})
		return
	}

	c.JSON(http.StatusOK, exchange)
}

func (ec *ExchangeController) UpdateExchangeStatus(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	exchangeIDStr := c.Param("id")
	exchangeID, err := strconv.ParseUint(exchangeIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid exchange ID"})
		return
	}

	var exchange models.Exchange
	if err := config.DB.Preload("Skill").First(&exchange, uint(exchangeID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Exchange not found"})
		return
	}

	// Only the skill owner can update exchange status (except for cancellation)
	var req UpdateExchangeStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check permissions
	if req.Status == "cancelled" {
		// Only the requester can cancel
		if exchange.RequesterID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only the requester can cancel this exchange"})
			return
		}
	} else {
		// Only the skill owner can accept/reject/complete
		if exchange.Skill.UserID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only the skill owner can update this exchange status"})
			return
		}
	}

	// Update exchange
	exchange.Status = req.Status
	exchange.ResponseText = req.ResponseText

	if err := config.DB.Save(&exchange).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update exchange status"})
		return
	}

	// Load relationships
	config.DB.Preload("Requester").Preload("Skill").Preload("Skill.User").First(&exchange, exchange.ID)

	c.JSON(http.StatusOK, exchange)
}

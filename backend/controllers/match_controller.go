package controllers

import (
	"net/http"
	"skillswap-backend/services"

	"github.com/gin-gonic/gin"
)

type MatchController struct{}

func (mc *MatchController) GetMatches(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	matchService := &services.MatchService{}
	matches, err := matchService.FindMatches(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find matches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"matches": matches})
}

// GetAdvancedMatches returns enhanced matches with additional scoring factors
func (mc *MatchController) GetAdvancedMatches(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	matchService := &services.MatchService{}
	matches, err := matchService.FindAdvancedMatches(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find advanced matches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"matches": matches})
}

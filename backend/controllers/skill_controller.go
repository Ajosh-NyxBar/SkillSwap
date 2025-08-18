package controllers

import (
	"net/http"
	"skillswap-backend/config"
	"skillswap-backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SkillController struct{}

type CreateSkillRequest struct {
	Title       string `json:"title" validate:"required"`
	Description string `json:"description"`
	Category    string `json:"category" validate:"required"`
	Level       string `json:"level" validate:"required,oneof=beginner intermediate advanced expert"`
	SkillType   string `json:"skill_type" validate:"required,oneof=offering seeking"`
	Tags        string `json:"tags"`
}

func (sc *SkillController) CreateSkill(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req CreateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	skill := models.Skill{
		UserID:      userID.(uint),
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		Level:       req.Level,
		SkillType:   req.SkillType,
		Tags:        req.Tags,
		IsActive:    true,
	}

	if err := config.DB.Create(&skill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create skill"})
		return
	}

	// Load user information
	config.DB.Preload("User").First(&skill, skill.ID)

	c.JSON(http.StatusCreated, skill)
}

func (sc *SkillController) GetSkills(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	skillType := c.Query("skill_type")
	category := c.Query("category")
	level := c.Query("level")
	search := c.Query("search")

	offset := (page - 1) * limit

	query := config.DB.Preload("User").Where("is_active = ?", true)

	if skillType != "" {
		query = query.Where("skill_type = ?", skillType)
	}

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if level != "" {
		query = query.Where("level = ?", level)
	}

	if search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var skills []models.Skill
	var total int64

	// Get total count
	query.Model(&models.Skill{}).Count(&total)

	// Get paginated results
	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&skills).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch skills"})
		return
	}

	response := gin.H{
		"skills": skills,
		"pagination": gin.H{
			"current_page": page,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
			"total_items":  total,
			"per_page":     limit,
		},
	}

	c.JSON(http.StatusOK, response)
}

func (sc *SkillController) GetSkillByID(c *gin.Context) {
	skillIDStr := c.Param("id")
	skillID, err := strconv.ParseUint(skillIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid skill ID"})
		return
	}

	var skill models.Skill
	if err := config.DB.Preload("User").First(&skill, uint(skillID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Skill not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, skill)
}

func (sc *SkillController) UpdateSkill(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	skillIDStr := c.Param("id")
	skillID, err := strconv.ParseUint(skillIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid skill ID"})
		return
	}

	var skill models.Skill
	if err := config.DB.First(&skill, uint(skillID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Skill not found"})
		return
	}

	// Check if the user owns this skill
	if skill.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own skills"})
		return
	}

	var req CreateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update skill fields
	skill.Title = req.Title
	skill.Description = req.Description
	skill.Category = req.Category
	skill.Level = req.Level
	skill.SkillType = req.SkillType
	skill.Tags = req.Tags

	if err := config.DB.Save(&skill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update skill"})
		return
	}

	// Load user information
	config.DB.Preload("User").First(&skill, skill.ID)

	c.JSON(http.StatusOK, skill)
}

func (sc *SkillController) DeleteSkill(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	skillIDStr := c.Param("id")
	skillID, err := strconv.ParseUint(skillIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid skill ID"})
		return
	}

	var skill models.Skill
	if err := config.DB.First(&skill, uint(skillID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Skill not found"})
		return
	}

	// Check if the user owns this skill
	if skill.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own skills"})
		return
	}

	if err := config.DB.Delete(&skill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete skill"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Skill deleted successfully"})
}

func (sc *SkillController) GetUserSkills(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var skills []models.Skill
	if err := config.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&skills).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user skills"})
		return
	}

	c.JSON(http.StatusOK, skills)
}

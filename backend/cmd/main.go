package main

import (
	"log"
	"skillswap-backend/config"
	"skillswap-backend/middleware"
	"skillswap-backend/models"
	"skillswap-backend/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	config.LoadConfig()

	// Set Gin mode
	gin.SetMode(config.AppConfig.GinMode)

	// Connect to database
	config.ConnectDatabase()

	// Auto migrate database tables
	err := config.DB.AutoMigrate(&models.User{}, &models.Skill{}, &models.Exchange{}, &models.ChatRoom{}, &models.Message{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Initialize Gin router
	router := gin.Default()

	// Configure router to handle trailing slashes
	router.RedirectTrailingSlash = false

	// Add CORS middleware
	router.Use(middleware.CORSMiddleware())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "SkillSwap API is running",
		})
	})

	// Setup routes
	routes.SetupRoutes(router, config.DB)

	// Start server
	port := ":" + config.AppConfig.Port
	log.Printf("Starting server on port %s", config.AppConfig.Port)
	log.Fatal(router.Run(port))
}

package routes

import (
	"skillswap-backend/controllers"
	"skillswap-backend/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(router *gin.Engine, db *gorm.DB) {
	// Initialize controllers
	authController := &controllers.AuthController{}
	skillController := &controllers.SkillController{}
	exchangeController := &controllers.ExchangeController{}
	matchController := &controllers.MatchController{}
	chatController := controllers.NewChatController(db)

	// API group
	api := router.Group("/api")
	{
		// Auth routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", authController.Register)
			auth.POST("/login", authController.Login)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// User/Profile routes
			user := protected.Group("/user")
			{
				user.GET("/profile", authController.GetProfile)
				user.PUT("/profile", authController.UpdateProfile)
				user.GET("/:id", authController.GetUserByID)
			}

			// Skill routes
			skills := protected.Group("/skills")
			{
				skills.POST("", skillController.CreateSkill)
				skills.GET("", skillController.GetSkills)
				skills.GET("/my", skillController.GetUserSkills)
				skills.GET("/:id", skillController.GetSkillByID)
				skills.PUT("/:id", skillController.UpdateSkill)
				skills.DELETE("/:id", skillController.DeleteSkill)
			}

			// Exchange routes
			exchanges := protected.Group("/exchanges")
			{
				exchanges.POST("", exchangeController.CreateExchange)
				exchanges.GET("", exchangeController.GetExchanges)
				exchanges.GET("/:id", exchangeController.GetExchangeByID)
				exchanges.PUT("/:id/status", exchangeController.UpdateExchangeStatus)
			}

			// Match routes
			matches := protected.Group("/matches")
			{
				matches.GET("", matchController.GetMatches)
			}

			// Chat routes
			chat := protected.Group("/chat")
			{
				chat.GET("/rooms", chatController.GetChatRooms)
				chat.POST("/rooms", chatController.CreateChatRoom)
				chat.GET("/rooms/:roomId/messages", chatController.GetMessages)
				chat.POST("/rooms/:roomId/messages", chatController.SendMessage)
				chat.PUT("/rooms/:roomId/read", chatController.MarkMessagesAsRead)
				chat.DELETE("/rooms/:roomId", chatController.DeleteChatRoom)
			}
		}
	}
}

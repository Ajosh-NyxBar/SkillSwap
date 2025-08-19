package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"skillswap-backend/models"
	"skillswap-backend/utils"
)

type ChatController struct {
	DB *gorm.DB
}

func NewChatController(db *gorm.DB) *ChatController {
	return &ChatController{DB: db}
}

// GetChatRooms returns all chat rooms for the current user
func (cc *ChatController) GetChatRooms(c *gin.Context) {
	userID := utils.GetUserIDFromContext(c)

	var chatRooms []models.ChatRoom
	result := cc.DB.Where("user1_id = ? OR user2_id = ?", userID, userID).
		Preload("User1").
		Preload("User2").
		Preload("Exchange").
		Order("last_message_at DESC, created_at DESC").
		Find(&chatRooms)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chat rooms"})
		return
	}

	// Process chat rooms to show the other user's info
	var processedRooms []gin.H
	for _, room := range chatRooms {
		var otherUser models.User
		if room.User1ID == userID {
			otherUser = room.User2
		} else {
			otherUser = room.User1
		}

		processedRoom := gin.H{
			"id":              room.ID,
			"other_user":      otherUser,
			"exchange_id":     room.ExchangeID,
			"last_message":    room.LastMessage,
			"last_message_at": room.LastMessageAt,
			"created_at":      room.CreatedAt,
		}
		processedRooms = append(processedRooms, processedRoom)
	}

	c.JSON(http.StatusOK, gin.H{"chat_rooms": processedRooms})
}

// CreateChatRoom creates a new chat room between two users
func (cc *ChatController) CreateChatRoom(c *gin.Context) {
	userID := utils.GetUserIDFromContext(c)

	var req struct {
		OtherUserID uint `json:"other_user_id" binding:"required"`
		ExchangeID  uint `json:"exchange_id,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if chat room already exists
	var existingRoom models.ChatRoom
	result := cc.DB.Where(
		"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
		userID, req.OtherUserID, req.OtherUserID, userID,
	).First(&existingRoom)

	if result.Error == nil {
		// Chat room already exists
		c.JSON(http.StatusOK, gin.H{"chat_room": existingRoom})
		return
	}

	// Create new chat room
	chatRoom := models.ChatRoom{
		User1ID:    userID,
		User2ID:    req.OtherUserID,
		ExchangeID: &req.ExchangeID,
		IsActive:   true,
	}

	if req.ExchangeID != 0 {
		chatRoom.ExchangeID = &req.ExchangeID
	}

	if err := cc.DB.Create(&chatRoom).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create chat room"})
		return
	}

	// Preload relationships
	cc.DB.Preload("User1").Preload("User2").Preload("Exchange").First(&chatRoom, chatRoom.ID)

	c.JSON(http.StatusCreated, gin.H{"chat_room": chatRoom})
}

// GetMessages returns all messages in a chat room
func (cc *ChatController) GetMessages(c *gin.Context) {
	userID := utils.GetUserIDFromContext(c)
	roomIDStr := c.Param("roomId")
	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	// Verify user has access to this chat room
	var chatRoom models.ChatRoom
	result := cc.DB.Where("id = ? AND (user1_id = ? OR user2_id = ?)", roomID, userID, userID).First(&chatRoom)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat room not found"})
		return
	}

	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	var messages []models.Message
	result = cc.DB.Where("chat_room_id = ?", roomID).
		Preload("Sender").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&messages)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	// Reverse the order to show oldest first
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": len(messages),
		},
	})
}

// SendMessage sends a new message to a chat room
func (cc *ChatController) SendMessage(c *gin.Context) {
	userID := utils.GetUserIDFromContext(c)
	roomIDStr := c.Param("roomId")
	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	var req struct {
		Content     string `json:"content" binding:"required"`
		MessageType string `json:"message_type"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify user has access to this chat room
	var chatRoom models.ChatRoom
	result := cc.DB.Where("id = ? AND (user1_id = ? OR user2_id = ?)", roomID, userID, userID).First(&chatRoom)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat room not found"})
		return
	}

	// Set default message type
	if req.MessageType == "" {
		req.MessageType = "text"
	}

	// Create message
	message := models.Message{
		ChatRoomID:  uint(roomID),
		SenderID:    userID,
		Content:     req.Content,
		MessageType: req.MessageType,
		IsRead:      false,
	}

	if err := cc.DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	// Update chat room last message
	now := time.Now()
	cc.DB.Model(&chatRoom).Updates(models.ChatRoom{
		LastMessage:   req.Content,
		LastMessageAt: &now,
	})

	// Preload sender info
	cc.DB.Preload("Sender").First(&message, message.ID)

	c.JSON(http.StatusCreated, gin.H{"message": message})
}

// MarkMessagesAsRead marks messages as read
func (cc *ChatController) MarkMessagesAsRead(c *gin.Context) {
	userID := utils.GetUserIDFromContext(c)
	roomIDStr := c.Param("roomId")
	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	// Verify user has access to this chat room
	var chatRoom models.ChatRoom
	result := cc.DB.Where("id = ? AND (user1_id = ? OR user2_id = ?)", roomID, userID, userID).First(&chatRoom)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat room not found"})
		return
	}

	// Mark messages as read (messages not sent by current user)
	now := time.Now()
	result = cc.DB.Model(&models.Message{}).
		Where("chat_room_id = ? AND sender_id != ? AND is_read = false", roomID, userID).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark messages as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Messages marked as read", "updated_count": result.RowsAffected})
}

// DeleteChatRoom soft deletes a chat room
func (cc *ChatController) DeleteChatRoom(c *gin.Context) {
	userID := utils.GetUserIDFromContext(c)
	roomIDStr := c.Param("roomId")
	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	// Verify user has access to this chat room
	var chatRoom models.ChatRoom
	result := cc.DB.Where("id = ? AND (user1_id = ? OR user2_id = ?)", roomID, userID, userID).First(&chatRoom)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat room not found"})
		return
	}

	// Soft delete the chat room
	if err := cc.DB.Delete(&chatRoom).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chat room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Chat room deleted successfully"})
}

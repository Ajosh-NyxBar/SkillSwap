package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email" validate:"required,email"`
	Username  string         `gorm:"uniqueIndex;not null" json:"username" validate:"required,min=3,max=20"`
	Password  string         `gorm:"not null" json:"-" validate:"required,min=6"`
	FullName  string         `gorm:"not null" json:"full_name" validate:"required"`
	Bio       string         `gorm:"type:text" json:"bio"`
	Avatar    string         `json:"avatar"`
	Location  string         `json:"location"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	OfferedSkills   []Skill     `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"offered_skills,omitempty"`
	Exchanges       []Exchange  `gorm:"foreignKey:RequesterID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"exchanges,omitempty"`
	UserRating      *UserRating `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user_rating,omitempty"`
	GivenReviews    []Review    `gorm:"foreignKey:ReviewerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"given_reviews,omitempty"`
	ReceivedReviews []Review    `gorm:"foreignKey:RevieweeID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"received_reviews,omitempty"`
}

type Skill struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `gorm:"not null" json:"user_id"`
	Title       string         `gorm:"not null" json:"title" validate:"required"`
	Description string         `gorm:"type:text" json:"description"`
	Category    string         `gorm:"not null" json:"category" validate:"required"`
	Level       string         `gorm:"not null" json:"level" validate:"required,oneof=beginner intermediate advanced expert"`
	SkillType   string         `gorm:"not null" json:"skill_type" validate:"required,oneof=offering seeking"`
	Tags        string         `json:"tags"` // JSON string of tags array
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User      User       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	Exchanges []Exchange `gorm:"foreignKey:SkillID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"exchanges,omitempty"`
}

type Exchange struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	RequesterID  uint           `gorm:"not null" json:"requester_id"`
	SkillID      uint           `gorm:"not null" json:"skill_id"`
	Message      string         `gorm:"type:text" json:"message"`
	Status       string         `gorm:"not null;default:'pending'" json:"status" validate:"oneof=pending accepted rejected completed cancelled"`
	ResponseText string         `gorm:"type:text" json:"response_text"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Requester User  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"requester,omitempty"`
	Skill     Skill `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"skill,omitempty"`
}

// Match represents a potential skill exchange match
type Match struct {
	UserID         uint   `json:"user_id"`
	UserName       string `json:"user_name"`
	UserAvatar     string `json:"user_avatar"`
	OfferedSkillID uint   `json:"offered_skill_id"`
	OfferedSkill   string `json:"offered_skill"`
	SeekingSkillID uint   `json:"seeking_skill_id"`
	SeekingSkill   string `json:"seeking_skill"`
	MatchScore     int    `json:"match_score"`
}

// ChatRoom represents a chat room between two users
type ChatRoom struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	User1ID       uint           `gorm:"not null" json:"user1_id"`
	User2ID       uint           `gorm:"not null" json:"user2_id"`
	ExchangeID    *uint          `json:"exchange_id"` // Optional: link to specific exchange
	IsActive      bool           `gorm:"default:true" json:"is_active"`
	LastMessage   string         `json:"last_message,omitempty"`
	LastMessageAt *time.Time     `json:"last_message_at,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User1    User      `gorm:"foreignKey:User1ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user1,omitempty"`
	User2    User      `gorm:"foreignKey:User2ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user2,omitempty"`
	Exchange *Exchange `gorm:"foreignKey:ExchangeID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"exchange,omitempty"`
	Messages []Message `gorm:"foreignKey:ChatRoomID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"messages,omitempty"`
}

// Message represents a chat message
type Message struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	ChatRoomID  uint           `gorm:"not null" json:"chat_room_id"`
	SenderID    uint           `gorm:"not null" json:"sender_id"`
	Content     string         `gorm:"type:text;not null" json:"content" validate:"required"`
	MessageType string         `gorm:"default:'text'" json:"message_type" validate:"oneof=text image file system"`
	IsRead      bool           `gorm:"default:false" json:"is_read"`
	ReadAt      *time.Time     `json:"read_at,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	ChatRoom ChatRoom `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"chat_room,omitempty"`
	Sender   User     `gorm:"foreignKey:SenderID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"sender,omitempty"`
}

// Review represents a review for a completed exchange
type Review struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	ExchangeID uint           `gorm:"not null;uniqueIndex" json:"exchange_id"` // One review per exchange
	ReviewerID uint           `gorm:"not null" json:"reviewer_id"`             // Who wrote the review
	RevieweeID uint           `gorm:"not null" json:"reviewee_id"`             // Who received the review
	Rating     int            `gorm:"not null" json:"rating" validate:"required,min=1,max=5"`
	Comment    string         `gorm:"type:text" json:"comment"`
	Tags       string         `json:"tags"` // JSON string of predefined tags like "helpful", "patient", "knowledgeable"
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Exchange Exchange `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"exchange,omitempty"`
	Reviewer User     `gorm:"foreignKey:ReviewerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"reviewer,omitempty"`
	Reviewee User     `gorm:"foreignKey:RevieweeID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"reviewee,omitempty"`
}

// UserRating represents aggregated rating data for a user
type UserRating struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `gorm:"not null;uniqueIndex" json:"user_id"`
	AverageRating float64   `gorm:"default:0" json:"average_rating"`
	TotalReviews  int       `gorm:"default:0" json:"total_reviews"`
	Rating1Count  int       `gorm:"default:0" json:"rating_1_count"`
	Rating2Count  int       `gorm:"default:0" json:"rating_2_count"`
	Rating3Count  int       `gorm:"default:0" json:"rating_3_count"`
	Rating4Count  int       `gorm:"default:0" json:"rating_4_count"`
	Rating5Count  int       `gorm:"default:0" json:"rating_5_count"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Relationships
	User User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
}

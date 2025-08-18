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
	OfferedSkills []Skill    `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"offered_skills,omitempty"`
	Exchanges     []Exchange `gorm:"foreignKey:RequesterID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"exchanges,omitempty"`
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

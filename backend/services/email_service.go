package services

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
	"skillswap-backend/config"
	"skillswap-backend/models"
	"strings"
)

type EmailService struct{}

type EmailTemplate struct {
	Subject string
	Body    string
}

// SendEmailNotification sends email notifications for various events
func (es *EmailService) SendEmailNotification(to, subject, body string) error {
	// Email configuration - should be in environment variables
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")

	if smtpHost == "" {
		smtpHost = "smtp.gmail.com"
	}
	if smtpPort == "" {
		smtpPort = "587"
	}

	// Skip sending if credentials not configured
	if smtpUser == "" || smtpPass == "" {
		log.Printf("Email not sent to %s: SMTP credentials not configured", to)
		return nil
	}

	from := smtpUser

	// Message
	message := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s", from, to, subject, body)

	// Authentication
	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

	// Send email
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, []byte(message))
	if err != nil {
		log.Printf("Failed to send email to %s: %v", to, err)
		return err
	}

	log.Printf("Email sent successfully to %s", to)
	return nil
}

// SendExchangeRequestNotification sends notification when someone requests a skill exchange
func (es *EmailService) SendExchangeRequestNotification(exchange models.Exchange) error {
	// Get skill owner's email
	var skillOwner models.User
	if err := config.DB.Joins("JOIN skills ON users.id = skills.user_id").
		Where("skills.id = ?", exchange.SkillID).First(&skillOwner).Error; err != nil {
		return err
	}

	// Get requester info
	var requester models.User
	if err := config.DB.First(&requester, exchange.RequesterID).Error; err != nil {
		return err
	}

	// Get skill info
	var skill models.Skill
	if err := config.DB.First(&skill, exchange.SkillID).Error; err != nil {
		return err
	}

	template := es.getExchangeRequestTemplate(requester, skill, exchange)
	return es.SendEmailNotification(skillOwner.Email, template.Subject, template.Body)
}

// SendExchangeStatusUpdateNotification sends notification when exchange status changes
func (es *EmailService) SendExchangeStatusUpdateNotification(exchange models.Exchange) error {
	// Get requester's email
	var requester models.User
	if err := config.DB.First(&requester, exchange.RequesterID).Error; err != nil {
		return err
	}

	// Get skill and skill owner info
	var skill models.Skill
	if err := config.DB.Preload("User").First(&skill, exchange.SkillID).Error; err != nil {
		return err
	}

	template := es.getExchangeStatusUpdateTemplate(skill.User, skill, exchange)
	return es.SendEmailNotification(requester.Email, template.Subject, template.Body)
}

// SendNewMatchNotification sends notification when new matches are found
func (es *EmailService) SendNewMatchNotification(userID uint, matches []models.Match) error {
	if len(matches) == 0 {
		return nil
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return err
	}

	template := es.getNewMatchTemplate(user, matches)
	return es.SendEmailNotification(user.Email, template.Subject, template.Body)
}

// SendNewReviewNotification sends notification when someone leaves a review
func (es *EmailService) SendNewReviewNotification(review models.Review) error {
	// Get reviewee's email
	var reviewee models.User
	if err := config.DB.First(&reviewee, review.RevieweeID).Error; err != nil {
		return err
	}

	// Get reviewer info
	var reviewer models.User
	if err := config.DB.First(&reviewer, review.ReviewerID).Error; err != nil {
		return err
	}

	template := es.getNewReviewTemplate(reviewer, reviewee, review)
	return es.SendEmailNotification(reviewee.Email, template.Subject, template.Body)
}

// SendWeeklyDigestNotification sends weekly summary of activity
func (es *EmailService) SendWeeklyDigestNotification(userID uint) error {
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return err
	}

	// Gather weekly stats
	weeklyStats := es.getWeeklyStats(userID)
	template := es.getWeeklyDigestTemplate(user, weeklyStats)

	return es.SendEmailNotification(user.Email, template.Subject, template.Body)
}

// Template functions
func (es *EmailService) getExchangeRequestTemplate(requester models.User, skill models.Skill, exchange models.Exchange) EmailTemplate {
	subject := fmt.Sprintf("New Skill Exchange Request - %s", skill.Title)

	body := fmt.Sprintf(`
Hello!

You have received a new skill exchange request on SkillSwap.

Request Details:
- From: %s (%s)
- Skill: %s
- Category: %s
- Level: %s
- Message: "%s"

To respond to this request, please log in to your SkillSwap account:
https://your-skillswap-app.com/exchanges

Best regards,
The SkillSwap Team
`, requester.FullName, requester.Email, skill.Title, skill.Category, skill.Level, exchange.Message)

	return EmailTemplate{Subject: subject, Body: body}
}

func (es *EmailService) getExchangeStatusUpdateTemplate(skillOwner models.User, skill models.Skill, exchange models.Exchange) EmailTemplate {
	var subject, statusText string

	switch exchange.Status {
	case "accepted":
		subject = "Exchange Request Accepted!"
		statusText = "accepted"
	case "rejected":
		subject = "Exchange Request Update"
		statusText = "declined"
	case "completed":
		subject = "Exchange Completed!"
		statusText = "marked as completed"
	case "cancelled":
		subject = "Exchange Cancelled"
		statusText = "cancelled"
	default:
		subject = "Exchange Status Update"
		statusText = "updated"
	}

	body := fmt.Sprintf(`
Hello!

Your skill exchange request has been %s.

Exchange Details:
- Skill Owner: %s
- Skill: %s
- Status: %s
- Response: "%s"

To view your exchanges, please log in to your SkillSwap account:
https://your-skillswap-app.com/exchanges

Best regards,
The SkillSwap Team
`, statusText, skillOwner.FullName, skill.Title, strings.ToUpper(string(exchange.Status[0]))+exchange.Status[1:], exchange.ResponseText)

	return EmailTemplate{Subject: subject, Body: body}
}

func (es *EmailService) getNewMatchTemplate(user models.User, matches []models.Match) EmailTemplate {
	subject := fmt.Sprintf("New Skill Matches Found - %d potential matches!", len(matches))

	matchList := ""
	for i, match := range matches[:min(len(matches), 5)] { // Show max 5 matches
		matchList += fmt.Sprintf("%d. %s offers %s (Match Score: %d%%)\n",
			i+1, match.UserName, match.OfferedSkill, match.MatchScore)
	}

	body := fmt.Sprintf(`
Hello %s!

We found new skill matches for you on SkillSwap!

Top Matches:
%s

To view all matches and connect with these users, please log in to your account:
https://your-skillswap-app.com/matches

Happy skill swapping!
The SkillSwap Team
`, user.FullName, matchList)

	return EmailTemplate{Subject: subject, Body: body}
}

func (es *EmailService) getNewReviewTemplate(reviewer, reviewee models.User, review models.Review) EmailTemplate {
	subject := "You received a new review!"

	stars := strings.Repeat("⭐", review.Rating) + strings.Repeat("☆", 5-review.Rating)

	body := fmt.Sprintf(`
Hello %s!

You have received a new review on SkillSwap!

Review Details:
- From: %s
- Rating: %s (%d/5 stars)
- Comment: "%s"

To view your complete review history, please log in to your account:
https://your-skillswap-app.com/profile

Thank you for being an active member of the SkillSwap community!
The SkillSwap Team
`, reviewee.FullName, reviewer.FullName, stars, review.Rating, review.Comment)

	return EmailTemplate{Subject: subject, Body: body}
}

type WeeklyStats struct {
	NewExchanges    int64
	NewMatches      int64
	NewMessages     int64
	CompletedSkills int64
	NewReviews      int64
}

func (es *EmailService) getWeeklyStats(userID uint) WeeklyStats {
	var stats WeeklyStats

	// Count exchanges from last week
	config.DB.Model(&models.Exchange{}).
		Where("requester_id = ? AND created_at > NOW() - INTERVAL 7 DAY", userID).
		Count(&stats.NewExchanges)

	// Count messages from last week
	config.DB.Model(&models.Message{}).
		Where("sender_id = ? AND created_at > NOW() - INTERVAL 7 DAY", userID).
		Count(&stats.NewMessages)

	// Count completed exchanges from last week
	config.DB.Model(&models.Exchange{}).
		Joins("JOIN skills ON exchanges.skill_id = skills.id").
		Where("(exchanges.requester_id = ? OR skills.user_id = ?) AND exchanges.status = 'completed' AND exchanges.updated_at > NOW() - INTERVAL 7 DAY", userID, userID).
		Count(&stats.CompletedSkills)

	// Count new reviews from last week
	config.DB.Model(&models.Review{}).
		Where("reviewee_id = ? AND created_at > NOW() - INTERVAL 7 DAY", userID).
		Count(&stats.NewReviews)

	return stats
}

func (es *EmailService) getWeeklyDigestTemplate(user models.User, stats WeeklyStats) EmailTemplate {
	subject := "Your Weekly SkillSwap Summary"

	body := fmt.Sprintf(`
Hello %s!

Here's your weekly SkillSwap activity summary:

📈 This Week's Activity:
- New Exchange Requests: %d
- Messages Sent: %d
- Skills Completed: %d
- New Reviews Received: %d

🎯 Keep Growing:
- Log in to check for new skill matches
- Complete pending exchanges
- Update your skill offerings

Ready to continue your skill journey?
https://your-skillswap-app.com/dashboard

Happy learning!
The SkillSwap Team
`, user.FullName, stats.NewExchanges, stats.NewMessages, stats.CompletedSkills, stats.NewReviews)

	return EmailTemplate{Subject: subject, Body: body}
}

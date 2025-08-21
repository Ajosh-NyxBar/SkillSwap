package services

import (
	"math"
	"skillswap-backend/config"
	"skillswap-backend/models"
	"sort"
	"strconv"
	"strings"
	"time"
)

type MatchService struct{}

type AdvancedMatch struct {
	models.Match
	UserRating          float64 `json:"user_rating"`
	LocationScore       int     `json:"location_score"`
	ActivityScore       int     `json:"activity_score"`
	CompletionRate      float64 `json:"completion_rate"`
	ResponseTime        string  `json:"response_time"`
	MutualInterest      bool    `json:"mutual_interest"`
	RecommendationScore int     `json:"recommendation_score"`
}

func (ms *MatchService) FindMatches(userID uint) ([]models.Match, error) {
	advancedMatches, err := ms.FindAdvancedMatches(userID)
	if err != nil {
		return nil, err
	}

	// Convert to basic Match format for compatibility
	matches := make([]models.Match, len(advancedMatches))
	for i, am := range advancedMatches {
		matches[i] = am.Match
	}

	return matches, nil
}

func (ms *MatchService) FindAdvancedMatches(userID uint) ([]AdvancedMatch, error) {
	var matches []AdvancedMatch

	// Get current user data
	var currentUser models.User
	if err := config.DB.Preload("UserRating").First(&currentUser, userID).Error; err != nil {
		return matches, err
	}

	// Get user's seeking skills
	var userSeekingSkills []models.Skill
	if err := config.DB.Where("user_id = ? AND skill_type = ? AND is_active = ?", userID, "seeking", true).Find(&userSeekingSkills).Error; err != nil {
		return matches, err
	}

	// For each seeking skill, find users who offer similar skills
	for _, seekingSkill := range userSeekingSkills {
		var offeredSkills []models.Skill
		query := config.DB.Preload("User").Preload("User.UserRating").Where("skill_type = ? AND is_active = ? AND user_id != ?", "offering", true, userID)

		// Enhanced category matching with fuzzy logic
		categoryMatches := ms.getCategoryMatches(seekingSkill.Category)
		if len(categoryMatches) > 0 {
			query = query.Where("category IN ?", categoryMatches)
		}

		// Enhanced level matching
		compatibleLevels := ms.getCompatibleLevels(seekingSkill.Level)
		if len(compatibleLevels) > 0 {
			query = query.Where("level IN ?", compatibleLevels)
		}

		if err := query.Find(&offeredSkills).Error; err != nil {
			continue
		}

		// Calculate enhanced match scores
		for _, offeredSkill := range offeredSkills {
			advancedMatch := ms.calculateAdvancedMatchScore(currentUser, seekingSkill, offeredSkill)
			if advancedMatch.MatchScore > 20 { // Higher threshold for quality matches
				matches = append(matches, advancedMatch)
			}
		}
	}

	// Find mutual matches with enhanced scoring
	mutualMatches, err := ms.findAdvancedMutualMatches(currentUser)
	if err == nil {
		matches = append(matches, mutualMatches...)
	}

	// Remove duplicates and apply advanced sorting
	matches = ms.removeDuplicateAdvancedMatches(matches)
	matches = ms.applyMLRanking(matches, currentUser)

	return matches, nil
}

func (ms *MatchService) calculateAdvancedMatchScore(currentUser models.User, seekingSkill, offeredSkill models.Skill) AdvancedMatch {
	baseScore := ms.calculateMatchScore(seekingSkill, offeredSkill)

	advancedMatch := AdvancedMatch{
		Match: models.Match{
			UserID:         offeredSkill.UserID,
			UserName:       offeredSkill.User.FullName,
			UserAvatar:     offeredSkill.User.Avatar,
			OfferedSkillID: offeredSkill.ID,
			OfferedSkill:   offeredSkill.Title,
			SeekingSkillID: seekingSkill.ID,
			SeekingSkill:   seekingSkill.Title,
			MatchScore:     baseScore,
		},
	}

	// User rating boost
	if offeredSkill.User.UserRating != nil {
		advancedMatch.UserRating = offeredSkill.User.UserRating.AverageRating
		ratingBoost := int(offeredSkill.User.UserRating.AverageRating * 5) // Max 25 points
		advancedMatch.MatchScore += ratingBoost
	}

	// Location proximity score
	advancedMatch.LocationScore = ms.calculateLocationScore(currentUser.Location, offeredSkill.User.Location)
	advancedMatch.MatchScore += advancedMatch.LocationScore

	// User activity score
	advancedMatch.ActivityScore = ms.calculateActivityScore(offeredSkill.UserID)
	advancedMatch.MatchScore += advancedMatch.ActivityScore

	// Completion rate
	advancedMatch.CompletionRate = ms.calculateCompletionRate(offeredSkill.UserID)
	completionBoost := int(advancedMatch.CompletionRate * 20) // Max 20 points
	advancedMatch.MatchScore += completionBoost

	// Response time estimation
	advancedMatch.ResponseTime = ms.estimateResponseTime(offeredSkill.UserID)

	// Check for mutual interest
	advancedMatch.MutualInterest = ms.checkMutualInterest(currentUser.ID, offeredSkill.UserID)
	if advancedMatch.MutualInterest {
		advancedMatch.MatchScore += 30 // Significant boost for mutual interest
	}

	// ML-based recommendation score
	advancedMatch.RecommendationScore = ms.calculateMLRecommendationScore(currentUser, offeredSkill)
	advancedMatch.MatchScore += advancedMatch.RecommendationScore

	return advancedMatch
}

func (ms *MatchService) getCategoryMatches(category string) []string {
	// Enhanced category matching with related categories
	categoryMap := map[string][]string{
		"Programming":     {"Programming", "Web Development", "Software Development", "Tech"},
		"Web Development": {"Web Development", "Programming", "Frontend", "Backend", "Fullstack"},
		"Design":          {"Design", "UI/UX", "Graphics", "Creative"},
		"Music":           {"Music", "Audio", "Sound", "Performance"},
		"Language":        {"Language", "Communication", "Writing", "Translation"},
		"Business":        {"Business", "Marketing", "Management", "Entrepreneurship"},
		"Art":             {"Art", "Creative", "Visual", "Crafts"},
		"Sports":          {"Sports", "Fitness", "Health", "Physical"},
		"Cooking":         {"Cooking", "Food", "Culinary", "Baking"},
		"Photography":     {"Photography", "Visual", "Creative", "Media"},
	}

	if matches, exists := categoryMap[category]; exists {
		return matches
	}
	return []string{category}
}

func (ms *MatchService) getCompatibleLevels(userLevel string) []string {
	levelMap := map[string][]string{
		"beginner":     {"beginner", "intermediate"},
		"intermediate": {"intermediate", "advanced"},
		"advanced":     {"intermediate", "advanced", "expert"},
		"expert":       {"advanced", "expert"},
	}

	if levels, exists := levelMap[userLevel]; exists {
		return levels
	}
	return []string{userLevel}
}

func (ms *MatchService) calculateLocationScore(location1, location2 string) int {
	if location1 == "" || location2 == "" {
		return 0
	}

	location1 = strings.ToLower(strings.TrimSpace(location1))
	location2 = strings.ToLower(strings.TrimSpace(location2))

	// Exact match
	if location1 == location2 {
		return 15
	}

	// City/region partial match
	words1 := strings.Fields(location1)
	words2 := strings.Fields(location2)

	for _, word1 := range words1 {
		for _, word2 := range words2 {
			if len(word1) > 3 && word1 == word2 {
				return 8 // Partial location match
			}
		}
	}

	return 0
}

func (ms *MatchService) calculateActivityScore(userID uint) int {
	// Check recent activity (last 30 days)
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)

	var recentActivity int64

	// Count recent skills posted
	config.DB.Model(&models.Skill{}).Where("user_id = ? AND created_at > ?", userID, thirtyDaysAgo).Count(&recentActivity)

	// Count recent exchanges
	var recentExchanges int64
	config.DB.Model(&models.Exchange{}).Where("requester_id = ? AND created_at > ?", userID, thirtyDaysAgo).Count(&recentExchanges)

	// Count recent messages
	var recentMessages int64
	config.DB.Model(&models.Message{}).Where("sender_id = ? AND created_at > ?", userID, thirtyDaysAgo).Count(&recentMessages)

	totalActivity := int(recentActivity + recentExchanges + (recentMessages / 5)) // Weight messages less

	if totalActivity >= 10 {
		return 15 // Very active
	} else if totalActivity >= 5 {
		return 10 // Active
	} else if totalActivity >= 1 {
		return 5 // Somewhat active
	}

	return 0 // Inactive
}

func (ms *MatchService) calculateCompletionRate(userID uint) float64 {
	var totalExchanges int64
	var completedExchanges int64

	// Count total exchanges where user was involved
	config.DB.Model(&models.Exchange{}).
		Joins("JOIN skills ON exchanges.skill_id = skills.id").
		Where("exchanges.requester_id = ? OR skills.user_id = ?", userID, userID).
		Count(&totalExchanges)

	if totalExchanges == 0 {
		return 0.5 // Neutral for new users
	}

	// Count completed exchanges
	config.DB.Model(&models.Exchange{}).
		Joins("JOIN skills ON exchanges.skill_id = skills.id").
		Where("(exchanges.requester_id = ? OR skills.user_id = ?) AND exchanges.status = ?", userID, userID, "completed").
		Count(&completedExchanges)

	return float64(completedExchanges) / float64(totalExchanges)
}

func (ms *MatchService) estimateResponseTime(userID uint) string {
	// Get average response time based on recent message patterns
	var avgHours float64

	// Simplified calculation - in a real system, this would be more sophisticated
	row := config.DB.Raw(`
		SELECT AVG(EXTRACT(EPOCH FROM (m2.created_at - m1.created_at))/3600) as avg_hours
		FROM messages m1
		JOIN messages m2 ON m1.chat_room_id = m2.chat_room_id 
		WHERE m1.sender_id != ? AND m2.sender_id = ?
		AND m2.created_at > m1.created_at
		AND m2.created_at - m1.created_at < interval '24 hours'
		AND m1.created_at > NOW() - interval '30 days'
	`, userID, userID).Row()

	row.Scan(&avgHours)

	if avgHours == 0 {
		return "New user"
	} else if avgHours < 1 {
		return "< 1 hour"
	} else if avgHours < 6 {
		return "< 6 hours"
	} else if avgHours < 24 {
		return "< 1 day"
	} else {
		return "1+ days"
	}
}

func (ms *MatchService) checkMutualInterest(userID1, userID2 uint) bool {
	// Check if both users have compatible seeking/offering skills
	var user1Seeking []models.Skill
	var user2Offering []models.Skill

	config.DB.Where("user_id = ? AND skill_type = ? AND is_active = ?", userID1, "seeking", true).Find(&user1Seeking)
	config.DB.Where("user_id = ? AND skill_type = ? AND is_active = ?", userID2, "offering", true).Find(&user2Offering)

	for _, seeking := range user1Seeking {
		for _, offering := range user2Offering {
			if seeking.Category == offering.Category {
				return true
			}
		}
	}

	return false
}

func (ms *MatchService) calculateMLRecommendationScore(currentUser models.User, offeredSkill models.Skill) int {
	// Simplified ML-inspired scoring based on user behavior patterns
	score := 0

	// User's historical preferences
	var userExchanges []models.Exchange
	config.DB.Preload("Skill").Where("requester_id = ?", currentUser.ID).Find(&userExchanges)

	// Category preference scoring
	categoryPreferences := make(map[string]int)
	for _, exchange := range userExchanges {
		categoryPreferences[exchange.Skill.Category]++
	}

	if count, exists := categoryPreferences[offeredSkill.Category]; exists {
		score += min(count*3, 15) // Max 15 points for category preference
	}

	// Level progression pattern
	seekingLevels := make(map[string]int)
	var userSeeking []models.Skill
	config.DB.Where("user_id = ? AND skill_type = ?", currentUser.ID, "seeking").Find(&userSeeking)

	for _, skill := range userSeeking {
		seekingLevels[skill.Level]++
	}

	// Bonus for progressive skill building
	if offeredSkill.Level == "intermediate" && seekingLevels["beginner"] > 0 {
		score += 5
	}
	if offeredSkill.Level == "advanced" && seekingLevels["intermediate"] > 0 {
		score += 5
	}

	return score
}

func (ms *MatchService) findAdvancedMutualMatches(currentUser models.User) ([]AdvancedMatch, error) {
	var matches []AdvancedMatch

	// Get user's offered skills
	var userOfferedSkills []models.Skill
	if err := config.DB.Where("user_id = ? AND skill_type = ? AND is_active = ?", currentUser.ID, "offering", true).Find(&userOfferedSkills).Error; err != nil {
		return matches, err
	}

	// Enhanced mutual matching logic
	for _, offeredSkill := range userOfferedSkills {
		var seekingSkills []models.Skill
		compatibleCategories := ms.getCategoryMatches(offeredSkill.Category)

		if err := config.DB.Preload("User").Preload("User.UserRating").
			Where("skill_type = ? AND is_active = ? AND user_id != ? AND category IN ?",
				"seeking", true, currentUser.ID, compatibleCategories).Find(&seekingSkills).Error; err != nil {
			continue
		}

		for _, seekingSkill := range seekingSkills {
			// Check for mutual offering
			var mutualOffering []models.Skill
			if err := config.DB.Where("user_id = ? AND skill_type = ? AND is_active = ?",
				seekingSkill.UserID, "offering", true).Find(&mutualOffering).Error; err != nil {
				continue
			}

			var currentUserSeeking []models.Skill
			if err := config.DB.Where("user_id = ? AND skill_type = ? AND is_active = ?",
				currentUser.ID, "seeking", true).Find(&currentUserSeeking).Error; err != nil {
				continue
			}

			for _, theirOffering := range mutualOffering {
				for _, mySeeking := range currentUserSeeking {
					compatibleCats := ms.getCategoryMatches(mySeeking.Category)
					categoryMatch := false
					for _, cat := range compatibleCats {
						if cat == theirOffering.Category {
							categoryMatch = true
							break
						}
					}

					if categoryMatch {
						advancedMatch := ms.calculateAdvancedMatchScore(currentUser, mySeeking, theirOffering)
						advancedMatch.MatchScore += 35 // Higher bonus for mutual match
						advancedMatch.MutualInterest = true
						matches = append(matches, advancedMatch)
					}
				}
			}
		}
	}

	return matches, nil
}

func (ms *MatchService) removeDuplicateAdvancedMatches(matches []AdvancedMatch) []AdvancedMatch {
	seen := make(map[string]AdvancedMatch)

	for _, match := range matches {
		key := strconv.Itoa(int(match.UserID)) + "-" + strconv.Itoa(int(match.OfferedSkillID)) + "-" + strconv.Itoa(int(match.SeekingSkillID))
		if existing, exists := seen[key]; !exists || match.MatchScore > existing.MatchScore {
			seen[key] = match
		}
	}

	var result []AdvancedMatch
	for _, match := range seen {
		result = append(result, match)
	}

	return result
}

func (ms *MatchService) applyMLRanking(matches []AdvancedMatch, currentUser models.User) []AdvancedMatch {
	// Advanced sorting with multiple criteria
	sort.Slice(matches, func(i, j int) bool {
		a, b := matches[i], matches[j]

		// Primary: Match score
		if a.MatchScore != b.MatchScore {
			return a.MatchScore > b.MatchScore
		}

		// Secondary: User rating
		if math.Abs(a.UserRating-b.UserRating) > 0.1 {
			return a.UserRating > b.UserRating
		}

		// Tertiary: Mutual interest
		if a.MutualInterest != b.MutualInterest {
			return a.MutualInterest
		}

		// Quaternary: Activity score
		return a.ActivityScore > b.ActivityScore
	})

	// Apply diversity filter to avoid showing too many matches from same user
	return ms.applyDiversityFilter(matches)
}

func (ms *MatchService) applyDiversityFilter(matches []AdvancedMatch) []AdvancedMatch {
	userCount := make(map[uint]int)
	var filtered []AdvancedMatch

	for _, match := range matches {
		if userCount[match.UserID] < 2 { // Max 2 matches per user
			filtered = append(filtered, match)
			userCount[match.UserID]++
		}
	}

	return filtered
}

func (ms *MatchService) calculateMatchScore(seekingSkill, offeredSkill models.Skill) int {
	score := 0

	// Base score for category match
	if seekingSkill.Category == offeredSkill.Category {
		score += 50
	}

	// Level compatibility score
	levelOrder := map[string]int{
		"beginner":     1,
		"intermediate": 2,
		"advanced":     3,
		"expert":       4,
	}

	seekingLevel := levelOrder[seekingSkill.Level]
	offeredLevel := levelOrder[offeredSkill.Level]

	if offeredLevel >= seekingLevel {
		score += 30
		// Bonus for exact level match
		if offeredLevel == seekingLevel {
			score += 10
		}
	}

	// Title/description similarity score
	score += ms.calculateTextSimilarity(seekingSkill.Title, offeredSkill.Title) * 20
	score += ms.calculateTextSimilarity(seekingSkill.Description, offeredSkill.Description) * 10

	// Tags similarity (if both have tags)
	if seekingSkill.Tags != "" && offeredSkill.Tags != "" {
		score += ms.calculateTagSimilarity(seekingSkill.Tags, offeredSkill.Tags) * 15
	}

	return score
}

func (ms *MatchService) calculateTextSimilarity(text1, text2 string) int {
	if text1 == "" || text2 == "" {
		return 0
	}

	text1 = strings.ToLower(text1)
	text2 = strings.ToLower(text2)

	words1 := strings.Fields(text1)
	words2 := strings.Fields(text2)

	commonWords := 0
	for _, word1 := range words1 {
		for _, word2 := range words2 {
			if word1 == word2 && len(word1) > 2 { // Only count words longer than 2 characters
				commonWords++
				break
			}
		}
	}

	if len(words1) == 0 || len(words2) == 0 {
		return 0
	}

	return (commonWords * 100) / max(len(words1), len(words2))
}

func (ms *MatchService) calculateTagSimilarity(tags1, tags2 string) int {
	// Assuming tags are comma-separated
	tagList1 := strings.Split(strings.ToLower(tags1), ",")
	tagList2 := strings.Split(strings.ToLower(tags2), ",")

	// Trim whitespace
	for i := range tagList1 {
		tagList1[i] = strings.TrimSpace(tagList1[i])
	}
	for i := range tagList2 {
		tagList2[i] = strings.TrimSpace(tagList2[i])
	}

	commonTags := 0
	for _, tag1 := range tagList1 {
		for _, tag2 := range tagList2 {
			if tag1 == tag2 && tag1 != "" {
				commonTags++
				break
			}
		}
	}

	if len(tagList1) == 0 || len(tagList2) == 0 {
		return 0
	}

	return (commonTags * 100) / max(len(tagList1), len(tagList2))
}

func (ms *MatchService) findMutualMatches(userID uint) ([]models.Match, error) {
	var matches []models.Match

	// Get user's offered skills
	var userOfferedSkills []models.Skill
	if err := config.DB.Where("user_id = ? AND skill_type = ? AND is_active = ?", userID, "offering", true).Find(&userOfferedSkills).Error; err != nil {
		return matches, err
	}

	// Find users who are seeking what the current user offers
	for _, offeredSkill := range userOfferedSkills {
		var seekingSkills []models.Skill
		if err := config.DB.Preload("User").Where("skill_type = ? AND is_active = ? AND user_id != ? AND category = ?", "seeking", true, userID, offeredSkill.Category).Find(&seekingSkills).Error; err != nil {
			continue
		}

		for _, seekingSkill := range seekingSkills {
			// Check if this user also offers something the current user wants
			var mutualOffering []models.Skill
			if err := config.DB.Where("user_id = ? AND skill_type = ? AND is_active = ?", seekingSkill.UserID, "offering", true).Find(&mutualOffering).Error; err != nil {
				continue
			}

			// Check if any of their offerings match what the current user seeks
			var currentUserSeeking []models.Skill
			if err := config.DB.Where("user_id = ? AND skill_type = ? AND is_active = ?", userID, "seeking", true).Find(&currentUserSeeking).Error; err != nil {
				continue
			}

			for _, theirOffering := range mutualOffering {
				for _, mySeeking := range currentUserSeeking {
					if theirOffering.Category == mySeeking.Category {
						score := ms.calculateMatchScore(mySeeking, theirOffering)
						if score > 0 {
							match := models.Match{
								UserID:         seekingSkill.UserID,
								UserName:       seekingSkill.User.FullName,
								UserAvatar:     seekingSkill.User.Avatar,
								OfferedSkillID: theirOffering.ID,
								OfferedSkill:   theirOffering.Title,
								SeekingSkillID: mySeeking.ID,
								SeekingSkill:   mySeeking.Title,
								MatchScore:     score + 25, // Bonus for mutual match
							}
							matches = append(matches, match)
						}
					}
				}
			}
		}
	}

	return matches, nil
}

func (ms *MatchService) removeDuplicateMatches(matches []models.Match) []models.Match {
	seen := make(map[string]bool)
	var result []models.Match

	for _, match := range matches {
		key := strconv.Itoa(int(match.UserID)) + "-" + strconv.Itoa(int(match.OfferedSkillID)) + "-" + strconv.Itoa(int(match.SeekingSkillID))
		if !seen[key] {
			seen[key] = true
			result = append(result, match)
		}
	}

	// Sort by match score (descending)
	sort.Slice(result, func(i, j int) bool {
		return result[i].MatchScore > result[j].MatchScore
	})

	return result
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

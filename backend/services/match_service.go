package services

import (
	"skillswap-backend/config"
	"skillswap-backend/models"
	"strings"
)

type MatchService struct{}

func (ms *MatchService) FindMatches(userID uint) ([]models.Match, error) {
	var matches []models.Match

	// Get user's seeking skills
	var userSeekingSkills []models.Skill
	if err := config.DB.Where("user_id = ? AND skill_type = ? AND is_active = ?", userID, "seeking", true).Find(&userSeekingSkills).Error; err != nil {
		return matches, err
	}

	// For each seeking skill, find users who offer similar skills
	for _, seekingSkill := range userSeekingSkills {
		var offeredSkills []models.Skill
		query := config.DB.Preload("User").Where("skill_type = ? AND is_active = ? AND user_id != ?", "offering", true, userID)

		// Match by category and level
		query = query.Where("category = ?", seekingSkill.Category)

		// Find skills at the same level or higher
		levelOrder := map[string]int{
			"beginner":     1,
			"intermediate": 2,
			"advanced":     3,
			"expert":       4,
		}

		userLevel := levelOrder[seekingSkill.Level]
		if userLevel > 0 {
			// Find skills at user's level or above
			var levelConditions []string
			for level, order := range levelOrder {
				if order >= userLevel {
					levelConditions = append(levelConditions, level)
				}
			}
			if len(levelConditions) > 0 {
				query = query.Where("level IN ?", levelConditions)
			}
		}

		if err := query.Find(&offeredSkills).Error; err != nil {
			continue
		}

		// Calculate match scores and create match records
		for _, offeredSkill := range offeredSkills {
			score := ms.calculateMatchScore(seekingSkill, offeredSkill)
			if score > 0 {
				match := models.Match{
					UserID:         offeredSkill.UserID,
					UserName:       offeredSkill.User.FullName,
					UserAvatar:     offeredSkill.User.Avatar,
					OfferedSkillID: offeredSkill.ID,
					OfferedSkill:   offeredSkill.Title,
					SeekingSkillID: seekingSkill.ID,
					SeekingSkill:   seekingSkill.Title,
					MatchScore:     score,
				}
				matches = append(matches, match)
			}
		}
	}

	// Also find mutual matches (users who want what you offer and offer what you want)
	mutualMatches, err := ms.findMutualMatches(userID)
	if err == nil {
		matches = append(matches, mutualMatches...)
	}

	// Remove duplicates and sort by score
	matches = ms.removeDuplicateMatches(matches)
	return matches, nil
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
		key := string(rune(match.UserID)) + "-" + string(rune(match.OfferedSkillID)) + "-" + string(rune(match.SeekingSkillID))
		if !seen[key] {
			seen[key] = true
			result = append(result, match)
		}
	}

	// Sort by match score (descending)
	for i := 0; i < len(result)-1; i++ {
		for j := i + 1; j < len(result); j++ {
			if result[i].MatchScore < result[j].MatchScore {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	return result
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

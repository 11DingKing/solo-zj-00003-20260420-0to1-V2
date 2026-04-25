package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"appointment-system/config"
	"appointment-system/middleware"
	"appointment-system/models"
	"appointment-system/services"
)

func GetSchedules(c *gin.Context) {
	date := c.Query("date")
	technicianID := c.Query("technician_id")

	var schedules []models.Schedule
	query := config.DB.Preload("Technician")

	if date != "" {
		query = query.Where("date = ?", date)
	}
	if technicianID != "" {
		query = query.Where("technician_id = ?", technicianID)
	}

	if err := query.Find(&schedules).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    schedules,
	})
}

func CreateSchedule(c *gin.Context) {
	var schedule models.Schedule
	if err := c.ShouldBindJSON(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	if err := middleware.ValidateStruct(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	if !isValidTimeFormat(schedule.StartTime) || !isValidTimeFormat(schedule.EndTime) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "时间格式不正确，应为 HH:MM",
		})
		return
	}

	schedule.StartTime = normalizeTimeFormat(schedule.StartTime)
	schedule.EndTime = normalizeTimeFormat(schedule.EndTime)

	if timeToMinutes(schedule.StartTime) >= timeToMinutes(schedule.EndTime) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "开始时间必须早于结束时间",
		})
		return
	}

	if err := config.DB.Create(&schedule).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    schedule,
	})
}

func GetSchedule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var schedule models.Schedule
	if err := config.DB.Preload("Technician").First(&schedule, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Schedule not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    schedule,
	})
}

func UpdateSchedule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var schedule models.Schedule
	if err := config.DB.First(&schedule, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Schedule not found",
		})
		return
	}

	var input models.Schedule
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	if input.StartTime != "" {
		if !isValidTimeFormat(input.StartTime) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "时间格式不正确，应为 HH:MM",
			})
			return
		}
		schedule.StartTime = input.StartTime
	}
	if input.EndTime != "" {
		if !isValidTimeFormat(input.EndTime) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "时间格式不正确，应为 HH:MM",
			})
			return
		}
		schedule.EndTime = input.EndTime
	}
	if input.Date != "" {
		schedule.Date = input.Date
	}
	if input.TechnicianID != 0 {
		schedule.TechnicianID = input.TechnicianID
	}

	if timeToMinutes(schedule.StartTime) >= timeToMinutes(schedule.EndTime) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "开始时间必须早于结束时间",
		})
		return
	}

	if err := config.DB.Save(&schedule).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    schedule,
	})
}

func DeleteSchedule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var schedule models.Schedule
	if err := config.DB.First(&schedule, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Schedule not found",
		})
		return
	}

	if err := config.DB.Delete(&schedule).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Schedule deleted successfully",
	})
}

func GetTechnicianSchedule(c *gin.Context) {
	technicianID, err := strconv.ParseUint(c.Param("technician_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid technician ID",
		})
		return
	}

	date := c.Param("date")

	var schedules []models.Schedule
	if err := config.DB.Where("technician_id = ? AND date = ?", uint(technicianID), date).Find(&schedules).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    schedules,
	})
}

func isValidTimeFormat(timeStr string) bool {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return false
	}

	hour, err := strconv.Atoi(parts[0])
	if err != nil || hour < 0 || hour > 23 {
		return false
	}

	minute, err := strconv.Atoi(parts[1])
	if err != nil || minute < 0 || minute > 59 {
		return false
	}

	if minute != 0 && minute != 30 {
		return false
	}

	return true
}

func timeToMinutes(timeStr string) int {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return 0
	}
	hour, _ := strconv.Atoi(parts[0])
	minute, _ := strconv.Atoi(parts[1])
	return hour*60 + minute
}

func normalizeTimeFormat(timeStr string) string {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return timeStr
	}
	hour, _ := strconv.Atoi(parts[0])
	minute, _ := strconv.Atoi(parts[1])
	return fmt.Sprintf("%02d:%02d", hour, minute)
}

func GetAvailableSlots(c *gin.Context) {
	date := c.Param("date")

	var technicians []models.Technician
	if err := config.DB.Find(&technicians).Error; err != nil {
		c.Error(err)
		return
	}

	result := make([]map[string]interface{}, 0)

	for _, tech := range technicians {
		var schedules []models.Schedule
		if err := config.DB.Where("technician_id = ? AND date = ?", tech.ID, date).Find(&schedules).Error; err != nil {
			continue
		}

		slots := services.GenerateTimeSlots(schedules)

		slotsWithAvailability := make([]map[string]interface{}, 0)
		for _, slot := range slots {
			var count int
			config.DB.Model(&models.Appointment{}).Where(
				"technician_id = ? AND date = ? AND start_time = ? AND status IN ?",
				tech.ID, date, slot.StartTime,
				[]models.AppointmentStatus{models.StatusPending, models.StatusConfirmed},
			).Count(&count)

			slotsWithAvailability = append(slotsWithAvailability, map[string]interface{}{
				"start_time": slot.StartTime,
				"end_time":   slot.EndTime,
				"available":  count < 3,
				"booked":     count,
				"max":        3,
			})
		}

		result = append(result, map[string]interface{}{
			"technician_id":   tech.ID,
			"technician_name": tech.Name,
			"slots":           slotsWithAvailability,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
	})
}

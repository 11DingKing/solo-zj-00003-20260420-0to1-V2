package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"appointment-system/config"
	"appointment-system/middleware"
	"appointment-system/models"
)

func GetAppointments(c *gin.Context) {
	date := c.Query("date")
	technicianID := c.Query("technician_id")
	status := c.Query("status")

	var appointments []models.Appointment
	query := config.DB.Preload("Technician")

	if date != "" {
		query = query.Where("date = ?", date)
	}
	if technicianID != "" {
		query = query.Where("technician_id = ?", technicianID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("date DESC, start_time DESC").Find(&appointments).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    appointments,
	})
}

func CreateAppointment(c *gin.Context) {
	var appointment models.Appointment
	if err := c.ShouldBindJSON(&appointment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	if err := middleware.ValidateStruct(&appointment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	appointment.StartTime = normalizeTime(appointment.StartTime)
	appointment.EndTime = normalizeTime(appointment.EndTime)

	var count int
	config.DB.Model(&models.Appointment{}).Where(
		"technician_id = ? AND date = ? AND start_time = ? AND status IN ?",
		appointment.TechnicianID, appointment.Date, appointment.StartTime,
		[]models.AppointmentStatus{models.StatusPending, models.StatusConfirmed},
	).Count(&count)

	if count >= 3 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "该时间段已约满，请选择其他时间",
		})
		return
	}

	appointment.Status = models.StatusPending

	if err := config.DB.Create(&appointment).Error; err != nil {
		c.Error(err)
		return
	}

	config.DB.Preload("Technician").First(&appointment, appointment.ID)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    appointment,
	})
}

func GetAppointment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var appointment models.Appointment
	if err := config.DB.Preload("Technician").First(&appointment, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Appointment not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    appointment,
	})
}

func UpdateAppointment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var appointment models.Appointment
	if err := config.DB.First(&appointment, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Appointment not found",
		})
		return
	}

	var input models.Appointment
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	if input.CustomerName != "" {
		appointment.CustomerName = input.CustomerName
	}
	if input.CustomerPhone != "" {
		appointment.CustomerPhone = input.CustomerPhone
	}
	if input.Status != "" {
		appointment.Status = input.Status
	}

	if err := config.DB.Save(&appointment).Error; err != nil {
		c.Error(err)
		return
	}

	config.DB.Preload("Technician").First(&appointment, appointment.ID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    appointment,
	})
}

func DeleteAppointment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var appointment models.Appointment
	if err := config.DB.First(&appointment, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Appointment not found",
		})
		return
	}

	if err := config.DB.Delete(&appointment).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Appointment deleted successfully",
	})
}

func ConfirmAppointment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var appointment models.Appointment
	if err := config.DB.First(&appointment, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Appointment not found",
		})
		return
	}

	if appointment.Status != models.StatusPending {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "只有待确认状态的预约可以确认",
		})
		return
	}

	appointment.Status = models.StatusConfirmed

	if err := config.DB.Save(&appointment).Error; err != nil {
		c.Error(err)
		return
	}

	config.DB.Preload("Technician").First(&appointment, appointment.ID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    appointment,
	})
}

func CompleteAppointment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var appointment models.Appointment
	if err := config.DB.First(&appointment, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Appointment not found",
		})
		return
	}

	if appointment.Status != models.StatusConfirmed {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "只有已确认状态的预约可以完成",
		})
		return
	}

	appointment.Status = models.StatusCompleted

	if err := config.DB.Save(&appointment).Error; err != nil {
		c.Error(err)
		return
	}

	config.DB.Preload("Technician").First(&appointment, appointment.ID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    appointment,
	})
}

func CancelAppointment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var appointment models.Appointment
	if err := config.DB.Preload("Technician").First(&appointment, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Appointment not found",
		})
		return
	}

	if appointment.Status == models.StatusCancelled || appointment.Status == models.StatusCompleted {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "该预约无法取消",
		})
		return
	}

	appointmentTime, err := parseDateTime(appointment.Date, appointment.StartTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "时间解析错误",
		})
		return
	}

	now := time.Now()
	diff := appointmentTime.Sub(now)

	if diff < 2*time.Hour {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "预约前2小时内无法取消预约",
		})
		return
	}

	appointment.Status = models.StatusCancelled

	if err := config.DB.Save(&appointment).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    appointment,
	})
}

func GetCustomerAppointments(c *gin.Context) {
	phone := c.Param("phone")

	var appointments []models.Appointment
	if err := config.DB.Preload("Technician").Where("customer_phone = ?", phone).Order("date DESC, start_time DESC").Find(&appointments).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    appointments,
	})
}

func parseDateTime(dateStr, timeStr string) (time.Time, error) {
	normalizedTime := normalizeTime(timeStr)
	layout := "2006-01-02 15:04"
	return time.ParseInLocation(layout, dateStr+" "+normalizedTime, time.Local)
}

func normalizeTime(timeStr string) string {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return timeStr
	}

	hour, _ := strconv.Atoi(parts[0])
	minute, _ := strconv.Atoi(parts[1])

	return fmt.Sprintf("%02d:%02d", hour, minute)
}

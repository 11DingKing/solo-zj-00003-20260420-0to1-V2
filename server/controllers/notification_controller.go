package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"appointment-system/config"
	"appointment-system/models"
	"appointment-system/services"
)

func GetNotifications(c *gin.Context) {
	receiverID := c.Query("receiver_id")
	receiverType := c.Query("receiver_type")
	isRead := c.Query("is_read")
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("page_size", "20")

	if receiverID == "" || receiverType == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "receiver_id and receiver_type are required",
		})
		return
	}

	page, _ := strconv.Atoi(pageStr)
	pageSize, _ := strconv.Atoi(pageSizeStr)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var notifications []models.Notification
	query := config.DB.Where("receiver_id = ? AND receiver_type = ?", receiverID, receiverType)

	if isRead != "" {
		isReadBool := strings.ToLower(isRead) == "true"
		query = query.Where("is_read = ?", isReadBool)
	}

	var total int64
	query.Model(&models.Notification{}).Count(&total)

	offset := (page - 1) * pageSize
	if err := query.Order("is_read ASC, created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&notifications).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    notifications,
		"pagination": gin.H{
			"page":       page,
			"page_size":  pageSize,
			"total":      total,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

func GetUnreadCount(c *gin.Context) {
	receiverID := c.Query("receiver_id")
	receiverType := c.Query("receiver_type")

	if receiverID == "" || receiverType == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "receiver_id and receiver_type are required",
		})
		return
	}

	var count int64
	if err := config.DB.Model(&models.Notification{}).
		Where("receiver_id = ? AND receiver_type = ? AND is_read = ?",
			receiverID, receiverType, false).
		Count(&count).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    count,
	})
}

func MarkAsRead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var notification models.Notification
	if err := config.DB.First(&notification, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Notification not found",
		})
		return
	}

	notification.IsRead = true
	if err := config.DB.Save(&notification).Error; err != nil {
		c.Error(err)
		return
	}

	services.BroadcastNotificationCount(notification.ReceiverID, string(notification.ReceiverType))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    notification,
	})
}

func MarkAllAsRead(c *gin.Context) {
	receiverID := c.Query("receiver_id")
	receiverType := c.Query("receiver_type")

	if receiverID == "" || receiverType == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "receiver_id and receiver_type are required",
		})
		return
	}

	if err := config.DB.Model(&models.Notification{}).
		Where("receiver_id = ? AND receiver_type = ? AND is_read = ?",
			receiverID, receiverType, false).
		Update("is_read", true).Error; err != nil {
		c.Error(err)
		return
	}

	services.BroadcastNotificationCount(receiverID, receiverType)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "All notifications marked as read",
	})
}

func SSEStream(c *gin.Context) {
	receiverID := c.Query("receiver_id")
	receiverType := c.Query("receiver_type")

	if receiverID == "" || receiverType == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "receiver_id and receiver_type are required",
		})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	clientID := fmt.Sprintf("%s_%s_%d", receiverType, receiverID, time.Now().UnixNano())

	channel := services.RegisterClient(clientID, receiverID, receiverType)
	defer services.UnregisterClient(clientID, receiverID, receiverType)

	var initialCount int64
	config.DB.Model(&models.Notification{}).
		Where("receiver_id = ? AND receiver_type = ? AND is_read = ?",
			receiverID, receiverType, false).
		Count(&initialCount)

	c.SSEvent("message", gin.H{
		"type":  "unread_count",
		"count": initialCount,
	})
	c.Writer.Flush()

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Streaming not supported",
		})
		return
	}

	for {
		select {
		case count := <-channel:
			c.SSEvent("message", gin.H{
				"type":  "unread_count",
				"count": count,
			})
			flusher.Flush()
		case <-c.Request.Context().Done():
			return
		}
	}
}

func CreateNotificationForTechnician(technicianID uint, notificationType models.NotificationType, title, content string, appointmentID *uint) error {
	notification := models.Notification{
		ReceiverID:    fmt.Sprintf("%d", technicianID),
		ReceiverType:  models.ReceiverTypeTechnician,
		Type:          notificationType,
		Title:         title,
		Content:       content,
		AppointmentID: appointmentID,
		IsRead:        false,
	}

	if err := config.DB.Create(&notification).Error; err != nil {
		return err
	}

	services.BroadcastNotificationCount(fmt.Sprintf("%d", technicianID), string(models.ReceiverTypeTechnician))

	return nil
}

func CreateNotificationForCustomer(phone string, notificationType models.NotificationType, title, content string, appointmentID *uint) error {
	notification := models.Notification{
		ReceiverID:    phone,
		ReceiverType:  models.ReceiverTypeCustomer,
		Type:          notificationType,
		Title:         title,
		Content:       content,
		AppointmentID: appointmentID,
		IsRead:        false,
	}

	if err := config.DB.Create(&notification).Error; err != nil {
		return err
	}

	services.BroadcastNotificationCount(phone, string(models.ReceiverTypeCustomer))

	return nil
}

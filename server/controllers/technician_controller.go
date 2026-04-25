package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"appointment-system/config"
	"appointment-system/middleware"
	"appointment-system/models"
)

func GetTechnicians(c *gin.Context) {
	var technicians []models.Technician
	if err := config.DB.Find(&technicians).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    technicians,
	})
}

func CreateTechnician(c *gin.Context) {
	var technician models.Technician
	if err := c.ShouldBindJSON(&technician); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	if err := middleware.ValidateStruct(&technician); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	if err := config.DB.Create(&technician).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    technician,
	})
}

func GetTechnician(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var technician models.Technician
	if err := config.DB.First(&technician, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Technician not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    technician,
	})
}

func UpdateTechnician(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var technician models.Technician
	if err := config.DB.First(&technician, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Technician not found",
		})
		return
	}

	var input models.Technician
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	if input.Name != "" {
		technician.Name = input.Name
	}
	if input.Phone != "" {
		technician.Phone = input.Phone
	}

	if err := config.DB.Save(&technician).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    technician,
	})
}

func DeleteTechnician(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID",
		})
		return
	}

	var technician models.Technician
	if err := config.DB.First(&technician, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Technician not found",
		})
		return
	}

	if err := config.DB.Delete(&technician).Error; err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Technician deleted successfully",
	})
}

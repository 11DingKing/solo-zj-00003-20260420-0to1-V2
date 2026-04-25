package config

import (
	"fmt"
	"log"
	"os"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"

	"appointment-system/models"
)

var DB *gorm.DB

func ConnectDB() {
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName,
	)

	var err error
	DB, err = gorm.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")

	DB.AutoMigrate(&models.Technician{}, &models.Schedule{}, &models.Appointment{}, &models.Notification{})

	initData()
}

func initData() {
	var count int
	DB.Model(&models.Technician{}).Count(&count)
	if count == 0 {
		technicians := []models.Technician{
			{Name: "张师傅", Phone: "13800138001"},
			{Name: "李师傅", Phone: "13800138002"},
			{Name: "王师傅", Phone: "13800138003"},
		}
		for _, t := range technicians {
			DB.Create(&t)
		}
		log.Println("Default technicians created")
	}
}

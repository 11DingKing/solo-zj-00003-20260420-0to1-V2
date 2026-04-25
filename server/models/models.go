package models

import (
	"time"

	"github.com/jinzhu/gorm"
)

type Technician struct {
	ID        uint       `gorm:"primary_key" json:"id"`
	CreatedAt time.Time  `json:"-"`
	UpdatedAt time.Time  `json:"-"`
	DeletedAt *time.Time `sql:"index" json:"-"`
	Name      string     `gorm:"not null" json:"name" validate:"required"`
	Phone     string     `json:"phone"`
}

type Schedule struct {
	ID           uint       `gorm:"primary_key" json:"id"`
	CreatedAt    time.Time  `json:"-"`
	UpdatedAt    time.Time  `json:"-"`
	DeletedAt    *time.Time `sql:"index" json:"-"`
	TechnicianID uint      `gorm:"not null" json:"technician_id" validate:"required"`
	Technician   Technician `gorm:"foreignkey:TechnicianID" json:"technician,omitempty" validate:"-"`
	Date         string     `gorm:"not null;type:date" json:"date" validate:"required"`
	StartTime    string     `gorm:"not null" json:"start_time" validate:"required"`
	EndTime      string     `gorm:"not null" json:"end_time" validate:"required"`
}

type AppointmentStatus string

const (
	StatusPending    AppointmentStatus = "pending"
	StatusConfirmed  AppointmentStatus = "confirmed"
	StatusCompleted  AppointmentStatus = "completed"
	StatusCancelled  AppointmentStatus = "cancelled"
)

type Appointment struct {
	ID           uint              `gorm:"primary_key" json:"id"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"-"`
	DeletedAt    *time.Time        `sql:"index" json:"-"`
	TechnicianID uint             `gorm:"not null" json:"technician_id" validate:"required"`
	Technician   Technician        `gorm:"foreignkey:TechnicianID" json:"technician,omitempty" validate:"-"`
	CustomerName string            `gorm:"not null" json:"customer_name" validate:"required"`
	CustomerPhone string           `gorm:"not null" json:"customer_phone" validate:"required,phone"`
	Date         string            `gorm:"not null;type:date" json:"date" validate:"required"`
	StartTime    string            `gorm:"not null" json:"start_time" validate:"required"`
	EndTime      string            `gorm:"not null" json:"end_time" validate:"required"`
	Status       AppointmentStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
}

func (a *Appointment) BeforeCreate(scope *gorm.Scope) error {
	if a.Status == "" {
		scope.SetColumn("Status", StatusPending)
	}
	return nil
}

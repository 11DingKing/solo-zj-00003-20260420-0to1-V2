package services

import (
	"fmt"
	"strconv"
	"strings"

	"appointment-system/models"
)

type TimeSlot struct {
	StartTime string
	EndTime   string
}

func GenerateTimeSlots(schedules []models.Schedule) []TimeSlot {
	slots := make([]TimeSlot, 0)

	for _, schedule := range schedules {
		startHour, startMinute := parseTime(schedule.StartTime)
		endHour, endMinute := parseTime(schedule.EndTime)

		currentHour := startHour
		currentMinute := startMinute

		for currentHour < endHour || (currentHour == endHour && currentMinute < endMinute) {
			slotStart := formatTime(currentHour, currentMinute)

			if currentMinute == 30 {
				currentHour++
				currentMinute = 0
			} else {
				currentMinute = 30
			}

			if currentHour > endHour || (currentHour == endHour && currentMinute > endMinute) {
				break
			}

			slotEnd := formatTime(currentHour, currentMinute)

			slots = append(slots, TimeSlot{
				StartTime: slotStart,
				EndTime:   slotEnd,
			})
		}
	}

	return slots
}

func parseTime(timeStr string) (hour, minute int) {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return 0, 0
	}

	hour, _ = strconv.Atoi(parts[0])
	minute, _ = strconv.Atoi(parts[1])
	return hour, minute
}

func formatTime(hour, minute int) string {
	return fmt.Sprintf("%02d:%02d", hour, minute)
}

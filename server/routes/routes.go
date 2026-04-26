package routes

import (
	"github.com/gin-gonic/gin"

	"appointment-system/controllers"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		technicians := api.Group("/technicians")
		{
			technicians.GET("", controllers.GetTechnicians)
			technicians.POST("", controllers.CreateTechnician)
			technicians.GET("/:id", controllers.GetTechnician)
			technicians.PUT("/:id", controllers.UpdateTechnician)
			technicians.DELETE("/:id", controllers.DeleteTechnician)
		}

		schedules := api.Group("/schedules")
		{
			schedules.GET("", controllers.GetSchedules)
			schedules.POST("", controllers.CreateSchedule)
			schedules.GET("/:id", controllers.GetSchedule)
			schedules.PUT("/:id", controllers.UpdateSchedule)
			schedules.DELETE("/:id", controllers.DeleteSchedule)
			schedules.GET("/technician/:technician_id/:date", controllers.GetTechnicianSchedule)
		}

		appointments := api.Group("/appointments")
		{
			appointments.GET("", controllers.GetAppointments)
			appointments.POST("", controllers.CreateAppointment)
			appointments.GET("/:id", controllers.GetAppointment)
			appointments.PUT("/:id", controllers.UpdateAppointment)
			appointments.DELETE("/:id", controllers.DeleteAppointment)
			appointments.PUT("/:id/confirm", controllers.ConfirmAppointment)
			appointments.PUT("/:id/complete", controllers.CompleteAppointment)
			appointments.PUT("/:id/cancel", controllers.CancelAppointment)
			appointments.GET("/customer/:phone", controllers.GetCustomerAppointments)
			appointments.GET("/validate/:phone", controllers.ValidateCustomerPhone)
		}

		slots := api.Group("/slots")
		{
			slots.GET("/:date", controllers.GetAvailableSlots)
		}

		notifications := api.Group("/notifications")
		{
			notifications.GET("", controllers.GetNotifications)
			notifications.GET("/unread-count", controllers.GetUnreadCount)
			notifications.PUT("/:id/read", controllers.MarkAsRead)
			notifications.PUT("/mark-all-read", controllers.MarkAllAsRead)
			notifications.GET("/stream", controllers.SSEStream)
		}
	}
}

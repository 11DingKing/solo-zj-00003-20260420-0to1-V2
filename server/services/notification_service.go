package services

import (
	"sync"

	"appointment-system/config"
	"appointment-system/models"
)

type SSEClient struct {
	ID           string
	ReceiverID   string
	ReceiverType string
	Channel      chan int64
}

var (
	clients     = make(map[string]map[string]*SSEClient)
	clientsLock sync.RWMutex
)

func getClientKey(receiverID, receiverType string) string {
	return receiverType + "_" + receiverID
}

func RegisterClient(clientID, receiverID, receiverType string) chan int64 {
	clientsLock.Lock()
	defer clientsLock.Unlock()

	key := getClientKey(receiverID, receiverType)
	channel := make(chan int64, 10)

	if clients[key] == nil {
		clients[key] = make(map[string]*SSEClient)
	}

	clients[key][clientID] = &SSEClient{
		ID:           clientID,
		ReceiverID:   receiverID,
		ReceiverType: receiverType,
		Channel:      channel,
	}

	return channel
}

func UnregisterClient(clientID, receiverID, receiverType string) {
	clientsLock.Lock()
	defer clientsLock.Unlock()

	key := getClientKey(receiverID, receiverType)
	if clients[key] != nil {
		delete(clients[key], clientID)
		if len(clients[key]) == 0 {
			delete(clients, key)
		}
	}
}

func BroadcastNotificationCount(receiverID, receiverType string) {
	clientsLock.RLock()
	defer clientsLock.RUnlock()

	key := getClientKey(receiverID, receiverType)
	if clients[key] == nil {
		return
	}

	var count int64
	config.DB.Model(&models.Notification{}).
		Where("receiver_id = ? AND receiver_type = ? AND is_read = ?",
			receiverID, receiverType, false).
		Count(&count)

	for _, client := range clients[key] {
		select {
		case client.Channel <- count:
		default:
		}
	}
}

package main

import (
	"errors"
)

/*
  UserID | driveAccessToken | driveRefreshToken | exparation
 --------|------------------|-------------------|--------


*/

type userCredentials struct {
	driveAccessToken  string
	driveRefreshToken string
	exparation        string
}

var (
	users = make(map[string]userCredentials)
)

func saveUser(userID, driveAccessToken, driveRefreshToken, exparation string) {
	var credentials = userCredentials{driveAccessToken, driveRefreshToken, exparation}
	users[userID] = credentials
}

func doesUserExist(userID string) bool {
	_, exists := users[userID]
	return exists
}

func getUserCredentials(userID string) (userCredentials, error) {
	credentials, exists := users[userID]
	if !exists {
		return userCredentials{}, errors.New("No such user")
	} else {
		return credentials, nil
	}
}

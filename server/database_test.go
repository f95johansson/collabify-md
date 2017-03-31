package main

import (
	"testing"
)

func TestSaveUser(t *testing.T) {
	saveUser("1", "2", "3", "4")
}

func TestIfUserExist(t *testing.T) {
	saveUser("1", "2", "3", "4")
	if !doesUserExist("1") {
		t.Error("Expected user \"1\" existed, but it did not")
	}
	if doesUserExist("2") {
		t.Error("Expected user \"2\" to not exits, but it did")
	}
}

func TestGetUserCredentialsIfExist(t *testing.T) {
	saveUser("1", "2", "3", "4")

	user, _ := getUserCredentials("1")

	if user.driveAccessToken != "2" ||
		user.driveRefreshToken != "3" ||
		user.exparation != "4" {

		t.Error("Expected user, but got ", user)
	}
}

func TestGetUserCredentialsIfNotExist(t *testing.T) {
	saveUser("1", "2", "3", "4")

	_, err := getUserCredentials("2")

	if err == nil {
		t.Error("Expected error, but got none")
	}
}

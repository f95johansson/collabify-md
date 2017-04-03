package main

import (
	"fmt"
	"testing"
)

func TestProvider(*testing.T) {
	provider := getOpenIDConnectProvider(ctx)
	fmt.Println(provider)
}

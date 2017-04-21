package main

import (
	"fmt"
	"net/http"

	"golang.org/x/net/context"
	"golang.org/x/net/websocket"
)

const (
	port    = "8082"
	wwwPath = "../client/dist"
)

var (
	ctx = context.Background()
)

func main() {
	http.HandleFunc("/api/login", login)
	http.HandleFunc("/api/login/callback/", loginCallback)
	http.HandleFunc("/editor/", edit)
	setupWebsocketCommunication("/api/documentsocket")
	fs := http.FileServer(http.Dir(wwwPath))

	/*withoutGz := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fs.ServeHTTP(w, r)
	})*/
	//withGz := gziphandler.GzipHand
	http.Handle("/", fs)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		fmt.Println(err)
	}
}

func login(w http.ResponseWriter, r *http.Request) {
	//_, _, err := Authenticate(r)
	//if err != nil {
	if true {
		url := LoginRedirect(ctx)
		http.Redirect(w, r,  url, http.StatusFound)
	} else {
		http.Redirect(w, r, "/editor", http.StatusFound)
	}
}

func loginCallback(w http.ResponseWriter, r *http.Request) {
	idTokenString, idToken, err := AuthenticateCallback(r)
	if err != nil {
		http.Redirect(w, r, "/error", http.StatusFound)
		fmt.Println(err)
		return
	}
	cookie := &http.Cookie{Name: "token", Value: idTokenString, Path:  "/", Expires: idToken.Expiry}
	http.SetCookie(w, cookie)

	http.Redirect(w, r, "/editor", http.StatusFound)
}

func edit(w http.ResponseWriter, r *http.Request) {
	idTokenString, idToken, err := Authenticate(r)
	if err != nil {
		http.Redirect(w, r, "/error", http.StatusFound)
		fmt.Println(err)
		return
	}

	cookie := &http.Cookie{Name: "token", Value: idTokenString, Path:  "/", Expires: idToken.Expiry}
	http.SetCookie(w, cookie)

	http.ServeFile(w, r, wwwPath+"/edit")
}

func setupWebsocketCommunication(url string) {
	http.Handle(url, websocket.Handler(GetWebSocketHandler()))
}

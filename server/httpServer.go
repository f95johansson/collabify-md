package main

import (
	"fmt"
	"net/http"

	"golang.org/x/net/context"
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
	http.HandleFunc("/edit", edit)
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
	http.Redirect(w, r, loginRedirect(ctx), http.StatusFound)
}

func edit(w http.ResponseWriter, r *http.Request) {
	if authenticate(r) {
		http.ServeFile(w, r, wwwPath)
	} else {
		http.Redirect(w, r, "/", http.StatusFound)
	}
}

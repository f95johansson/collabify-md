package main

import (
	"fmt"
	"net/http"
)

const (
	port = "8082"
)

func main() {
	fs := http.FileServer(http.Dir("../client/dist"))
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

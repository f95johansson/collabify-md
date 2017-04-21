package main

import (
	"github.com/jeffail/leaps/lib/acl"
	"github.com/jeffail/leaps/lib/binder"
	"github.com/jeffail/leaps/lib/curator"
	"github.com/jeffail/leaps/lib/store"
	"github.com/jeffail/leaps/lib/text"
	"github.com/jeffail/leaps/lib/http"
	"github.com/jeffail/util/log"
	"github.com/jeffail/util/metrics"
	//"fmt"
	"os"
	"testing"
	"golang.org/x/net/websocket"
	netHttp "net/http"
	//"time"
	"time"
	"fmt"
)

func authAndStore() (acl.Authenticator, store.Type) {
	return &acl.Anarchy{AllowCreate: true}, store.NewMemory()
}

func makeLog() log.Modular {
	logConf := log.NewLoggerConfig()
	logConf.LogLevel = "ALL"

	logger := log.NewLogger(os.Stdout, logConf)
	//stats := metrics.DudType{}

	return logger //, stats
}

func TestCreateDocument(t *testing.T) {
	str := "# hello"
	memory := store.NewMemory()
	document, _ := store.NewDocument(str)
	memory.Create(*document)

	document2, err := memory.Read(document.ID)
	if err != nil {
		t.Error(err)
	}

	if document2.Content != str {
		t.Error("Content did not match")
	}

}

func TestCreateCurator(t *testing.T) {
	logger := makeLog()
	auth, storage := authAndStore()
	cur, err := curator.New(curator.NewConfig(), logger, auth, storage)
	if err != nil {
		t.Errorf("Create curator error: %v", err)
		return
	}
	str := "# hello"
	document, _ := store.NewDocument(str)
	cur.CreateDocument("1", "a", *document, 50)
}

func TestCreateCuratorAndGet(t *testing.T) {
	logger := makeLog()
	auth, storage := authAndStore()
	cur, err := curator.New(curator.NewConfig(), logger, auth, storage)
	if err != nil {
		t.Errorf("Create curator error: %v", err)
		return
	}
	str := "# hello"
	document, err := store.NewDocument(str)
	if err != nil {
		t.Error("Create document error: ", err)
	}
	storage.Create(*document)
	cur.CreateDocument("1", "a", *document, 500000)
	portal, err := cur.EditDocument("2", "b", document.ID, 500000)
	if err != nil {
		t.Errorf("Create portal error: %v", err)
		return
	}
	ot := text.OTransform{
		Version:  1,
		Position: 2,
		Insert:   "goodbye ",
		Delete:   0}
	portal.SendTransform(ot, 50000)
}

func TestWebsocket(t *testing.T) {
	logger := makeLog()
	stats := metrics.DudType{}
	auth, storage := authAndStore()
	cur, _ := curator.New(curator.NewConfig(), logger, auth, storage)
	str := "# hello"
	document, err := store.NewDocument(str)
	if err != nil {
		t.Error("Create document error: ", err)
	}
	storage.Create(*document)
	cur.CreateDocument("1", "a", *document, 500000)
	fmt.Println(document.ID)
	netHttp.Handle("/ws", websocket.Handler(http.WebsocketHandler(cur, time.Second, logger, stats)))
	netHttp.ListenAndServe(":8083", nil)
	t.Errorf("Error")
}

func TestCreateBinder(t *testing.T) {
	memory := store.NewMemory()
	document, _ := store.NewDocument("# Hello")
	memory.Create(*document)

	config := binder.NewConfig()
	errors := make(chan<- binder.Error)
	_, err := binder.New(document.ID, memory, config, errors, makeLog())
	if err != nil {
		t.Errorf("Create binder error: %v", err)
		return
	}
}

func TestCreatePortal(t *testing.T) {
	memory := store.NewMemory()
	document, _ := store.NewDocument("# Hello")
	memory.Create(*document)

	config := binder.NewConfig()
	errors := make(chan<- binder.Error)
	bind, err := binder.New(document.ID, memory, config, errors, makeLog())
	if err != nil {
		t.Errorf("Create binder error: %v", err)
		return
	}

	port, err := bind.Subscribe("1", 10000000000)
	if err != nil {
		t.Errorf("Create portal error: %v", err)
		return
	}

	port.SendMessage(binder.Message{Content: "Content"})
}

package main

import (
	"github.com/jeffail/leaps/lib/acl"
	"github.com/jeffail/leaps/lib/curator"
	"github.com/jeffail/leaps/lib/store"
	"github.com/jeffail/leaps/lib/http"
	"github.com/jeffail/util/log"
	"github.com/jeffail/util/metrics"
	"os"
	"time"
	"golang.org/x/net/websocket"
)

var (
	otHandler         curator.Type
	storage           store.Type
	logger            log.Modular
	statisticsCounter = metrics.DudType{}
	accessManager     acl.Authenticator
)

func makeLogger() log.Modular {
	logConf := log.NewLoggerConfig()
	logConf.LogLevel = "ALL"
	logger := log.NewLogger(os.Stdout, logConf)
	return logger
}

func makeStatisticsCounter() metrics.DudType {
	return metrics.DudType{}
}

func makeAccessManager() acl.Authenticator {
	return &acl.Anarchy{AllowCreate: true}
}

func makeStorage() store.Type {
	return store.NewMemory()
}

func GetLogger() log.Modular {
	if logger == nil {
		logger = makeLogger()
	}
	return logger
}

func GetStatisticsCounter() metrics.DudType {
	return statisticsCounter
}

func GetStorage() store.Type {
	if storage == nil {
		storage = makeStorage()
	}
	return storage
}

func GetAccessManager() acl.Authenticator {
	if accessManager == nil {
		accessManager = makeAccessManager()
	}
	return accessManager
}

func GetOTHandler() curator.Type {
	if otHandler == nil {
		var err error
		otHandler, err = curator.New(
			curator.NewConfig(),
			GetLogger(),
			GetAccessManager(),
			GetStorage())
		if err != nil {
			logger.Errorln(err.Error())
		}
	}
	return otHandler
}

func GetWebSocketHandler() func(ws *websocket.Conn) {
	return http.WebsocketHandler(GetOTHandler(), time.Second, GetLogger(), GetStatisticsCounter())
}

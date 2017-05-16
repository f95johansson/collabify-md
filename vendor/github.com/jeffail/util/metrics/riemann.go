/*
Copyright (c) 2014 Ashley Jeffs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, sub to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

package metrics

import (
	"fmt"
	"sync"
	"time"

	"github.com/amir/raidman"
)

//--------------------------------------------------------------------------------------------------

// RiemannConfig - Configuration fields for a riemann service.
type RiemannConfig struct {
	Enabled       bool     `json:"enabled" yaml:"enabled"`
	Server        string   `json:"server" yaml:"server"`
	TTL           float32  `json:"ttl" yaml:"ttl"`
	Tags          []string `json:"tags" yaml:"tags"`
	FlushInterval string   `json:"flush_interval" yaml:"flush_interval"`
}

// NewRiemannConfig - Create a new riemann config with default values.
func NewRiemannConfig() RiemannConfig {
	return RiemannConfig{
		Enabled:       false,
		Server:        "",
		TTL:           5,
		Tags:          []string{"service"},
		FlushInterval: "2s",
	}
}

//--------------------------------------------------------------------------------------------------

// Riemann - A Riemann client that supports the EventAggregator interface.
type Riemann struct {
	sync.RWMutex

	config RiemannConfig

	Client      *raidman.Client
	eventsCache map[string]*raidman.Event

	flushInterval time.Duration
	quit          chan bool
}

// NewRiemann - Create a new riemann client.
func NewRiemann(config RiemannConfig) (*Riemann, error) {
	interval, err := time.ParseDuration(config.FlushInterval)
	if nil != err {
		return nil, fmt.Errorf("failed to parse flush interval: %v", err)
	}

	client, err := raidman.Dial("tcp", config.Server)
	if err != nil {
		return nil, err
	}

	r := &Riemann{
		config:        config,
		Client:        client,
		flushInterval: interval,
		eventsCache:   make(map[string]*raidman.Event),
		quit:          make(chan bool),
	}

	go r.loop()

	return r, nil
}

//--------------------------------------------------------------------------------------------------

// SendEvent - Send a riemann event, the event is cached and send in batches.
func (r *Riemann) SendEvent(e *Event) {
	r.Lock()
	defer r.Unlock()

	event := (*raidman.Event)(e)
	event.Ttl = r.config.TTL
	event.Tags = append(r.config.Tags, event.Tags...)

	r.eventsCache[e.Service] = event
}

// Close - Close the riemann client and stop batch uploading.
func (r *Riemann) Close() {
	close(r.quit)
}

//--------------------------------------------------------------------------------------------------

func (r *Riemann) loop() {
	ticker := time.NewTicker(r.flushInterval)
	for {
		select {
		case <-ticker.C:
			r.flushMetrics()
		case <-r.quit:
			r.Client.Close()
			return
		}
	}
}

func (r *Riemann) flushMetrics() {
	r.Lock()
	defer r.Unlock()

	events := make([]*raidman.Event, len(r.eventsCache))
	i := 0
	for _, event := range r.eventsCache {
		events[i] = event
		i++
	}

	if err := r.Client.SendMulti(events); err == nil {
		r.eventsCache = make(map[string]*raidman.Event)
	} else {
		var newClient *raidman.Client
		newClient, err = raidman.DialWithTimeout("tcp", r.config.Server, r.flushInterval)
		if err == nil {
			r.Client.Close()
			r.Client = newClient
		}
	}
}

//--------------------------------------------------------------------------------------------------

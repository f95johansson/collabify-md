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
	"errors"
	"fmt"
	"net/http"
	"runtime"
	"sync"
	"time"

	"github.com/jeffail/gabs"
)

//--------------------------------------------------------------------------------------------------

// Errors for the Type type.
var (
	ErrTypeNotTracked = errors.New("internal stats not being tracked")
	ErrTimedOut       = errors.New("timed out")
)

// Type - A stats object with capability to hold internal stats as a JSON endpoint.
type Type struct {
	config      Config
	jsonRoot    *gabs.Container
	json        *gabs.Container
	flatMetrics map[string]int
	pathPrefix  string
	timestamp   time.Time

	riemannClient *Riemann

	sync.Mutex
}

// New - Create and return a new Type object.
func New(config Config) (*Type, error) {
	var jsonRoot, json *gabs.Container
	var pathPrefix string

	jsonRoot = gabs.New()
	if len(config.Prefix) > 0 {
		pathPrefix = config.Prefix + "."
		json, _ = jsonRoot.ObjectP(config.Prefix)
	} else {
		json = jsonRoot
	}

	t := Type{
		config:      config,
		jsonRoot:    jsonRoot,
		json:        json,
		flatMetrics: map[string]int{},
		pathPrefix:  pathPrefix,
		timestamp:   time.Now(),
	}

	if config.Riemann.Enabled {
		var err error
		t.riemannClient, err = NewRiemann(config.Riemann)
		if err != nil {
			return nil, fmt.Errorf("Failed to init riemann client: %v", err)
		}
	}

	return &t, nil
}

//--------------------------------------------------------------------------------------------------

// JSONHandler - Returns a handler for accessing metrics as a JSON blob.
func (t *Type) JSONHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uptime := time.Since(t.timestamp).String()
		goroutines := runtime.NumGoroutine()

		t.Lock()

		t.json.SetP(fmt.Sprintf("%v", uptime), "uptime")
		t.json.SetP(goroutines, "goroutines")
		blob := t.jsonRoot.Bytes()

		t.Unlock()

		w.Header().Set("Content-Type", "application/json")
		w.Write(blob)
	}
}

// SendEvent - Send an event.
func (t *Type) SendEvent(e *Event) {
	if t.riemannClient != nil {
		e.Service = t.pathPrefix + e.Service
		t.riemannClient.SendEvent(e)
	}
}

// Incr - Increment a stat by a value.
func (t *Type) Incr(stat string, value int) {
	t.Lock()
	total, _ := t.flatMetrics[stat]
	total += value

	t.flatMetrics[stat] = total
	t.json.SetP(total, stat)
	t.Unlock()

	if t.riemannClient != nil {
		t.riemannClient.SendEvent(&Event{
			Tags:    []string{"meter"},
			Metric:  total,
			Service: t.pathPrefix + stat,
		})
	}
}

// Decr - Decrement a stat by a value.
func (t *Type) Decr(stat string, value int) {
	t.Lock()
	total, _ := t.flatMetrics[stat]
	total -= value

	t.flatMetrics[stat] = total
	t.json.SetP(total, stat)
	t.Unlock()

	if t.riemannClient != nil {
		t.riemannClient.SendEvent(&Event{
			Tags:    []string{"meter"},
			Metric:  total,
			Service: t.pathPrefix + stat,
		})
	}
}

// Timing - Set a stat representing a duration.
func (t *Type) Timing(stat string, delta int) {
	readable := time.Duration(delta).String()

	t.Lock()
	t.flatMetrics[stat] = delta
	t.json.SetP(delta, stat)
	t.json.SetP(readable, stat+"_readable")
	t.Unlock()

	if t.riemannClient != nil {
		t.riemannClient.SendEvent(&Event{
			Tags:    []string{"meter"},
			Metric:  delta,
			Service: t.pathPrefix + stat,
		})
	}
}

// Gauge - Set a stat as a gauge value.
func (t *Type) Gauge(stat string, value int) {
	t.Lock()
	t.flatMetrics[stat] = value
	t.json.SetP(value, stat)
	t.Unlock()

	if t.riemannClient != nil {
		t.riemannClient.SendEvent(&Event{
			Tags:    []string{"meter"},
			Metric:  value,
			Service: t.pathPrefix + stat,
		})
	}
}

// Close - Stops the Type object from aggregating metrics and cleans up resources.
func (t *Type) Close() {
	if t.riemannClient != nil {
		t.riemannClient.Close()
		t.riemannClient = nil
	}
}

//--------------------------------------------------------------------------------------------------

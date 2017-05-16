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

import "net/http"

// Aggregator - An interface for metrics aggregation.
type Aggregator interface {
	// JSONHandler - Returns a handler for accessing metrics as a JSON blob.
	JSONHandler() http.HandlerFunc

	// Incr - Increment a metric by an amount.
	Incr(path string, count int)

	// Decr - Decrement a metric by an amount.
	Decr(path string, count int)

	// Timing - Set a timing metric.
	Timing(path string, delta int)

	// Gauge - Set a gauge metric.
	Gauge(path string, value int)

	// Close - Stop aggregating stats and clean up resources.
	Close()
}

// EventAggregator - An interface for event based metrics aggregation.
type EventAggregator interface {
	// SendEvent - Send an event type.
	SendEvent(e *Event)

	// Close - Stop aggregating stats and clean up resources.
	Close()
}

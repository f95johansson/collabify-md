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

// DudType - Implements the Aggregator interface but doesn't actual do anything.
type DudType struct{}

// JSONHandler - Does nothing.
func (d DudType) JSONHandler() http.HandlerFunc {
	return func(http.ResponseWriter, *http.Request) {}
}

// Incr - Does nothing.
func (d DudType) Incr(path string, count int) {}

// Decr - Does nothing.
func (d DudType) Decr(path string, count int) {}

// Timing - Does nothing.
func (d DudType) Timing(path string, delta int) {}

// Gauge - Does nothing.
func (d DudType) Gauge(path string, value int) {}

// Close - Does nothing.
func (d DudType) Close() {}

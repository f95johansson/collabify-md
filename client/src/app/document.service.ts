import { Injectable } from '@angular/core';
import { Observable, Observer } from './interfaces/observer-observable.interface';

@Injectable()
export class DocumentService implements Observable {
  private socket: WebSocket;
  private observers: Array<Observer>

  constructor() { }

  /**
   * Sets up a WebSocket-connection to the server at the given URL
   * When this method has been called, observers can register for
   * events via the subscribe method.
   * @param url the url to connect to
   */
  connect(url: string) {
    if (!this.socket === null) return;
  }

  private notifyObservers(data) {
    this.observers.forEach(observer => {
      observer.update(this, data);
    });
  }

  addObserver(observer: Observer) {
    this.observers.push(observer);
  }

}

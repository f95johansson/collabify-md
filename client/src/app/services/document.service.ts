import { Injectable } from '@angular/core';
import * as diffjs from 'diff';

import { Observable, Observer } from '../interfaces/observer-observable.interface';
import { DocumentUpdate } from '../document-update';

@Injectable()
export class DocumentService implements Observable {
  private socket: WebSocket;
  private observers: Observer[] = [];
  private oldDocument: string = '';
  private document: string = '';
  private documentId: number;
  private documentVersion: number;

  constructor() {
    this.connect('ws://'+window.location.host+'/api/documentsocket', this.connectToDocument);
    setInterval(this.uploadChanges.bind(this), 2000);
  }

  /**
   * Sets up a WebSocket-connection to the server at the given URL
   * When this method has been called, observers can register for
   * events via the registerObserver method.
   * @param url the url to connect to
   * @param onConnect callback invoked when connection complete
   * @param onError callback invoked if error occured
   */
  connect(url: string, onConnect = () => {}, onError = () => {}) {
    if (this.socket !== undefined) 
      return;

    this.socket = new WebSocket(url);
    this.socket.onmessage = this.wsBridge.bind(this);
    this.socket.onopen = onConnect.bind(this); 
    this.socket.onerror = onError.bind(this);
  }

  connectToDocument() {
    this.socket.send(JSON.stringify({
      command: 'edit',
      token: '1',
      user_id: '1',
      document_id: "14944949448c9e3de9-3aab-4c06-bc90-d6f67a2a4a96",
      leap_document: {
        document_id: "14944949448c9e3de9-3aab-4c06-bc90-d6f67a2a4a96",
        content: '--'
      }
    }))
  }

  private wsBridge(response) {
    let data = JSON.parse(response.data)
    console.log(data)
    if (data.response_type === 'document') {
      this.documentId = data.id;
      this.documentVersion = data.version;
      
    } else if (data.response_type === 'correction') {
      this.documentVersion = data.version;

    } else if (data.response_type === 'transforms') {
      for (var update of data.transforms) {
        this.notifyObservers(new DocumentUpdate(update));
      }
    }
  }

  /**
   * Notifies all the observers of the change
   * @param data the data to send
   */
  private notifyObservers(data) {
    this.observers.forEach(observer => {
      observer.update(this, data);
    });
  }

  /**
   * @inheritdoc
   */
  registerObserver(observer: Observer) {
    this.observers.push(observer);
  }

  /**
   * Notifies the document model that a change were made to the document view
   * @param newDocument the change-object
   */
  update(newDocument: string) {
    this.document = newDocument;
    this.notifyObservers(this.document);
  }

  /**
   * Post changes to docuement to the server
   * @param changes the changes to post
   */
  private uploadChanges() {
    if (this.socket === undefined || this.socket.readyState !== this.socket.OPEN) return;

    this.packChanges(this.document).forEach((update) => {
      this.socket.send(update.packForTransfer(this.documentVersion+1));
    });
  }

  /**
   * Receives the new state of the docuement and creates a list of document updates
   * @param newDocument the new docuement
   */
  private packChanges(newDocument: string): DocumentUpdate[] {
    let diffArr = diffjs.diffChars(this.oldDocument, newDocument);
    let cursorPos = 0;
    let updates = [];

    diffArr.forEach((diff) => {
      if (diff.added) {
        updates.push(new DocumentUpdate({
          position: cursorPos,
          insert: diff.value,
          version: updates.length,
        }));
        cursorPos += diff.count;

      } else if (diff.removed) {
        updates.push(new DocumentUpdate({
          position: cursorPos,
          num_delete: diff.count,
          version: updates.length,
        }));
        cursorPos -= diff.count;
      } else {
        cursorPos += diff.count;
      }
    });

    this.oldDocument = newDocument;

    return updates;
  }

  disconnect() {
    this.socket.close();
  }
}

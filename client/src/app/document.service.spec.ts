import { TestBed, inject } from '@angular/core/testing';

import { DocumentService } from './document.service';

import { Observer, Observable } from './interfaces/observer-observable.interface';

describe('DocumentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentService]
    });
  });

  it('should open a connection', inject([DocumentService], (service: DocumentService) => {
    let onSuccess = () => {
    }
    service.registerObserver({update:(subject: Observable, action: Object) => {
      expect(action).toEqual("message");
    }});
    service.connect("ws://echo.websocket.org", onSuccess);
  }));
});

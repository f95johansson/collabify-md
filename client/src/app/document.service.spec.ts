import { TestBed, inject } from '@angular/core/testing';

import { DocumentService } from './document.service';

describe('DocumentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentService]
    });
  });

  it('should not crash when subscribing without connection', 
  inject([DocumentService], (service: DocumentService) => {
    expect(service.subscribe(() => {})).toBeFalsy();
  }));
});

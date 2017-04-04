import * as showdown from 'showdown';

import { Component, OnInit } from '@angular/core';
import { Observable, Observer } from '../../interfaces/observer-observable.interface';
import { DocumentService } from '../../services/document.service';
import { DocumentUpdate } from '../../document-update';

@Component({
  selector: 'app-preview-area',
  templateUrl: './preview-area.component.html',
  styleUrls: ['./preview-area.component.scss'],
})
export class PreviewAreaComponent implements OnInit, Observer {
  private converter: showdown.Converter;
  rawDocument: string = "";
  compiledDocument: HTMLElement;

  constructor(private documentService: DocumentService) { }

  ngOnInit() {
    this.documentService.registerObserver(this);
    this.converter = new showdown.Converter();
  }

  update(subject: Observable, action: Object) {
    (<DocumentUpdate[]> action).forEach(action => {
      if (!action.applyUpdate) return;
      this.rawDocument = action.applyUpdate(this.rawDocument)
    });
    this.compiledDocument = this.converter.makeHtml(this.rawDocument);
  }

}

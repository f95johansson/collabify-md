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
  document: string = "";

  constructor(private documentService: DocumentService) { }

  ngOnInit() {
    this.documentService.registerObserver(this);
  }

  update(subject: Observable, action: Object) {
    (<DocumentUpdate[]> action).forEach(action => {
      if (!action.applyUpdate) return;
      this.document = action.applyUpdate(this.document)});
  }

}

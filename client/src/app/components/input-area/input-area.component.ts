import { Component, OnInit } from '@angular/core';
import { DocumentService } from '../../services/document.service';
import { Observer, Observable } from '../../interfaces/observer-observable.interface';
import { DocumentUpdate } from '../../document-update';

@Component({
  selector: 'app-input-area',
  templateUrl: './input-area.component.html',
  styleUrls: ['./input-area.component.scss'],
})
export class InputAreaComponent implements OnInit, Observer {
  document: string = "";

  constructor(private documentService: DocumentService) { }

  ngOnInit() {
    this.documentService.connect("ws://echo.websocket.org");
    this.documentService.registerObserver(this);
    setInterval(this.updateModel.bind(this), 2500);
  }

  update(subject: Observable, action: Object) {
    //this.document = (<DocumentUpdate> action).insert;
  }

  userUpdate(event) {
    this.document = event.currentTarget.innerHTML;
  }

  updateModel() {
    this.documentService.update(this.document);
  }
}

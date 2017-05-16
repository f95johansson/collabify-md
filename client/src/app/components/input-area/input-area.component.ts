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
    this.documentService.registerObserver(this);
  }

  update(subject: Observable, action: Object) {
    console.log(action)
    this.document = (<DocumentUpdate> action).applyUpdate(this.document);
  }

  userUpdate(event) {
    //this.document = event.currentTarget.innerText;
    this.updateModel(event.currentTarget.innerText);
  }

  updateModel(newText: string) {
    this.documentService.update(newText);
  }
}

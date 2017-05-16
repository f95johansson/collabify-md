import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml} from '@angular/platform-browser';
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

  constructor(private documentService: DocumentService,
              private domSanitizer: DomSanitizer) { }

  ngOnInit() {
    this.documentService.registerObserver(this);
  }

  update(subject: Observable, action: Object) {
    console.log(action)
    this.document = (<DocumentUpdate> action).applyUpdate(this.document);
  }

  userUpdate(event) {
    this.document = event.currentTarget.innerText;
    this.updateModel(event.currentTarget.innerHTML);
  }

  updateModel(newText: string) {
    this.documentService.update(newText);
  }

  public get insertDocument(): SafeHtml {
    return this.domSanitizer.bypassSecurityTrustHtml(this.document);
  }
}

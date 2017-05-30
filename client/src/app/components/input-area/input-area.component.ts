import { Component, OnInit, AfterViewChecked, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml} from '@angular/platform-browser';
import { DocumentService } from '../../services/document.service';
import { Observer, Observable } from '../../interfaces/observer-observable.interface';
import { DocumentUpdate } from '../../document-update';

@Component({
  selector: 'app-input-area',
  templateUrl: './input-area.component.html',
  styleUrls: ['./input-area.component.scss'],
})
export class InputAreaComponent implements OnInit, AfterViewChecked, Observer {
  document: string = "";
  cursorChanged: boolean = false;
  cursorPosition: number = 0;
  @ViewChild('inputArea') inputElement; 

  constructor(private documentService: DocumentService,
              private domSanitizer: DomSanitizer) { }

  ngOnInit() {
    this.documentService.registerObserver(this);
  }

  update(subject: Observable, action: Object) {
    if (!(action instanceof DocumentUpdate)) return;
    console.log(action)
    this.document = (<DocumentUpdate> action).applyUpdate(this.document);
  }

  userUpdate(event) {
    //this.document = event.currentTarget.innerText;
    //this.document = event.currentTarget.textContent;
    //this.document = event.currentTarget.innerHTML;
    this.updateModel(event.currentTarget.innerHTML);
  }

  updateModel(newText: string) {
    this.documentService.update(newText);
  }

  updateRender(): string {
    this.cursorChanged = true;
    this.cursorPosition = getCaretPosition(this.inputElement.nativeElement);
    return this.document;
  }

  ngAfterViewChecked() {
    if (this.cursorChanged) {
      this.cursorChanged = false;
      setCaretPosition(this.inputElement.nativeElement, this.cursorPosition);
    }
  }

  public get insertDocument(): SafeHtml {
    return this.domSanitizer.bypassSecurityTrustHtml(this.document);
  }
}

function setCaretPosition(editableDiv, position) {
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(editableDiv, position);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    editableDiv.focus();
}

function getCaretPosition(editableDiv): number {
  var caretPos = 0,
    sel, range;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0);
      if (range.commonAncestorContainer.parentNode == editableDiv) {
        caretPos = range.endOffset;
      }
    }
  }
  return caretPos;
}

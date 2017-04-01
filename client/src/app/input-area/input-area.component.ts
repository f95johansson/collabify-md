import { Component, OnInit } from '@angular/core';
import { DocumentService } from '../document.service';

@Component({
  selector: 'app-input-area',
  templateUrl: './input-area.component.html',
  styleUrls: ['./input-area.component.scss'],
  providers: [DocumentService]
})
export class InputAreaComponent implements OnInit {
  document: string;

  constructor(private documentService: DocumentService) { }

  ngOnInit() {
    this.documentService.getDocument().then(document => this.document = document);
  }

  change(event) {
    
  }

}

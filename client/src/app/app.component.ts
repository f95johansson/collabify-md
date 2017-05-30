import { Component } from '@angular/core';
import { InputAreaComponent } from './components/input-area/input-area.component';
import { DocumentService } from './services/document.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [DocumentService],
})
export class AppComponent {
  private documentService: DocumentService;
  createdDocumentId: string = '';

  constructor(documentService: DocumentService) {
    this.documentService = documentService;
  }

  createDocument(event) {
    this.documentService.connectToCreateDocument((id) => {
      this.createdDocumentId = id;
    })
  }

  editDocument(event, documentId) {
    this.documentService.connectToEditDocument(documentId)
  }
}

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { InputAreaComponent } from './components/input-area/input-area.component';
import { DocumentService } from './services/document.service';
import { PreviewAreaComponent } from './components/preview-area/preview-area.component';

@NgModule({
  declarations: [
    AppComponent,
    InputAreaComponent,
    PreviewAreaComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

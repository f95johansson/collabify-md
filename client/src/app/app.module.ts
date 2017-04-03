import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { InputAreaComponent } from './input-area/input-area.component';
import { DocumentService } from './document.service';
import { PreviewAreaComponent } from './preview-area/preview-area.component';

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

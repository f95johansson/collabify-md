import * as showdown from 'showdown';
import * as katex from 'katex';

import { Component, OnInit, ViewEncapsulation, ElementRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Observable, Observer } from '../../interfaces/observer-observable.interface';
import { DocumentService } from '../../services/document.service';
import { DocumentUpdate } from '../../document-update';

declare var AMTparseAMtoTeX;


@Component({
  selector: 'app-preview-area',
  templateUrl: './preview-area.component.html',
  styleUrls: ['./preview-area.component.scss', './pub.scss', './katex.css', './toc.scss'],
  //encapsulation: ViewEncapsulation.Native
})
export class PreviewAreaComponent implements OnInit, Observer {
  private converter: showdown.Converter;
  rawDocument: string = "";
  compiledDocument: HTMLElement;

  constructor(private documentService: DocumentService,
    private domSanitizer: DomSanitizer,
    private elem: ElementRef) { }

  ngOnInit() {
    this.documentService.registerObserver(this);
    showdown.extension('parseMath', this.parseMath);
    showdown.extension('parseFootNotes', this.parseFootNotes);
    showdown.extension('parseToc', this.parseToc);
    this.converter = new showdown.Converter(
      {
        extensions: ['parseMath', 'parseFootNotes', 'parseToc']
      }
    );
    this.converter.setFlavor('github');
  }

  update(subject: Observable, action: Object) {
      this.rawDocument = this.paginate(<string>action);
  }

  public get compileDocument(): SafeHtml {
    let ret = this.domSanitizer.bypassSecurityTrustHtml(this.converter.makeHtml(this.rawDocument));
    return ret;
  }

  private paginate(action: string): string {
    var e = this.elem.nativeElement;
    let w = parseInt(window.getComputedStyle(e).width)
    let frac = w / 793;
    let h = parseInt(window.getComputedStyle(e).height)/frac;
    e.style.maxHeight = `${h}px`;
    return this.doPages(e, action);
  }

  private doPages(e: Element, str: string): string {
    let pages = Array.from(e.querySelectorAll(".page"));
    let page = pages.slice(-1)[0];
    let containerHeight = parseInt(window.getComputedStyle(e).height);
    let pageHeight = parseInt(window.getComputedStyle(page).height);
    console.log(this.rawDocument.length, str.length)
    return ((containerHeight < pageHeight) && 
            this.rawDocument.length < str.length) ? this.trim(page) : str;
  }

  private trim(elem: Element): string {
    elem.innerHTML = elem.innerHTML.split("")
                                   .map(word => `<span>${word}</span>`)
                                   .join("");

    let height = elem.parentElement.parentElement.clientHeight; //parseInt(window.getComputedStyle(elem).height);
    let clipped = "";
    let elements = Array.from(elem.querySelectorAll("span"));
    elements.forEach((e, i) => {
      if (e.offsetTop > height) { // && i > (elements.length / 2)
        clipped += e.innerText;
      }
    });
    let str = elem.innerHTML.replace(/<span>/g,"").replace(/<\/span>/g, "");
    return this.splitAt(str, str.length - clipped.length).map(page => this.htmlDecode(page) )
                                                         .join("");
    
    //return this.htmlDecode(this.splitAt(str, str.length - clipped.length)[0]);
  }

  private splitAt(str: string, index: number): string[] {
    return [].concat(str.substring(0, index)).concat(str.substring(index));
  }

  private htmlDecode(input) {
    let doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent += '<span class="pageBreak"></span>';
  }

  private parseMath() {
    let parseMath = {
      type: 'output',
      filter: function (html) {
        let parser = new DOMParser();
        let DOM = parser.parseFromString(html, "text/html");
        let latex = Array.from(DOM.querySelectorAll('code.latex'));
        let ascii = Array.from(DOM.querySelectorAll('code.asciimath'));
        latex.forEach(elem => {
          try {
            elem.innerHTML = katex.renderToString(elem.innerHTML);
          } catch (ignore) { }
        });
        ascii.forEach(elem => {
          try {
            elem.innerHTML = katex.renderToString(AMTparseAMtoTeX(elem.innerHTML));
          } catch (ignore) { }
        });
        return DOM.body.innerHTML;
      }
    }
    return [parseMath];
  }

  private parseFootNotes() {
    let footnotes = {
          type: 'lang', filter: function (text) {
            // Inline footnotes e.g. "foo[^1]"                              
            var i = 0;
            var inline_regex = /\[\^(\d|n)\](?!:)/g;
            text = text.replace(inline_regex, function (match, n) {
              // We allow both automatic and manual footnote numbering    
              if (n == "n") n = i + 1;

              var s = '<sup id="fnref:' + n + '">' +
                '<a href="#fn:' + n + '" rel="footnote">' + n + '</a>' +
                '</sup>';
              i += 1;
              return s;
            });

            // Expanded footnotes at the end e.g. "[^1]: cool stuff"        
            var end_regex = /\[\^(\d|n)\]: (.*?)\n/g;
            var m = text.match(end_regex);
            var total = m ? m.length : 0;
            var i = 0;

            text = text.replace(end_regex, function (match, n, content) {
              if (n == "n") n = i + 1;

              var s = '<li class="footnote" id="fn:' + n + '">' +
                '<p>' + content + '<a href="#fnref:' + n +
                '" title="return to article"> ↩</a>' +
                '</p>' +
                '</li>'

              if (i == 0) {
                s = '<div class="footnotes"><ol>' + s;
              }

              if (i == total - 1) {
                s = s + '</ol></div>'
              }
              i += 1;
              return s;
            });
            return text;
          }
        }
    return [footnotes];
  }

  private parseToc() {
    var _self = PreviewAreaComponent;
    let toc = {
      type: 'output', filter: (html) => {
        let parser = new DOMParser();
        let DOM = parser.parseFromString(html, "text/html");
        let headings = Array.from(DOM.querySelectorAll("h1, h2, h3, h4, h5, h6"));
        let index = _self.generateTocElement(headings); 
        index.classList.add("table-of-content");
        
        html = html.replace("\[toc\]", index.outerHTML);
        return html;
      }
    }
    return [toc];
  }

  static generateTocElement(headings: Array<Element>):HTMLElement {
    let index = document.createElement("ul");
    let inserted = Array(6).fill(0);
    headings.forEach((heading) => {
      let listItem = document.createElement("li");
      let link = document.createElement("a");
      link.text = this.addSection(inserted, heading, heading.textContent);
      link.href = `#${heading.id}`;
      listItem.appendChild(link);
      index.appendChild(listItem);
    });
    return index;
  }

  private static addSection(inserted, heading:Element, text):string {
    let out = "";
    switch (heading.nodeName) {
      case "H1":
        inserted[0]++;
        out += `${inserted[0]} ${text}`;
        inserted.fill(0, 1);
      break;
      case "H2":
        inserted[1]++;
        out += `${inserted[0]}.${inserted[1]} ${text}`;
        inserted.fill(0, 2);
      break;
      case "H3":
        inserted[2]++;
        out += `${inserted[0]}.${inserted[1]}.${inserted[2]} ${text}`;
        inserted.fill(0, 3);
      break;
      case "H4":
        inserted[3]++;
        out += `${inserted[0]}.${inserted[1]}.${inserted[2]}.${inserted[3]} ${text}`;
        inserted.fill(0, 4);
      break;
      case "H5":
        inserted[4]++;
        out += `${inserted[0]}.${inserted[1]}.${inserted[2]}.${inserted[3]}.${inserted[4]} ${text}`;
        inserted.fill(0, 5);
      break;
      case "H6":
        inserted[5]++;
        out += `${inserted[0]}.${inserted[1]}.${inserted[2]}.${inserted[3]}.${inserted[4]}.${inserted[5]} ${text}`;
        inserted.fill(0, 6);
      break;
    }
    return out;
  }
}

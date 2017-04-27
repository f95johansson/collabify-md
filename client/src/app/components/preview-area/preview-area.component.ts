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

  /**
   * Runs the stored source code string through the markdown compiler and 
   * returns a html-structure that can be displayed in the view.
   */
  public get compileDocument(): SafeHtml {
    return this.domSanitizer.bypassSecurityTrustHtml(this.converter.makeHtml(this.rawDocument));
  }

  private paginate(action: string): string {
    var e = this.elem.nativeElement;
    let w = parseInt(window.getComputedStyle(e).width)
    let frac = w / 793;
    let h = parseInt(window.getComputedStyle(e).height) / frac;
    e.style.maxHeight = `${h}px`;
    return this.doPages(e, action);
  }

  private doPages(e: Element, str: string): string {
    let page = e.querySelector("#document");
    let containerHeight = parseInt(window.getComputedStyle(e).height);
    let pageHeight = parseInt(window.getComputedStyle(page).height);

    page.innerHTML = str;
    return ((containerHeight < pageHeight) && 
            (this.rawDocument.replace(/\s+/g, "").length <= str.replace(/\s+/g, "").length)) ? 
            this.trim(<HTMLElement>page) : str;
  }

  private trim(elem: HTMLElement): string {
    elem.innerHTML = elem.innerText.split("")
                                   .map(char => `<span>${char}</span>`)
                                   .join("");

    let height = elem.parentElement.parentElement.clientHeight;
    let clipped = "";
    let elements = Array.from(elem.querySelectorAll("span"));
    elements.forEach((e, i) => {
      if (e.offsetTop > height) {
        clipped += e.innerText;
      }
    });
    let str = elem.innerHTML.replace(/<span>/g, "").replace(/<\/span>/g, "");
    let pageLength = str.length - clipped.length;
    return this.chunk(str, pageLength)
               .map(page => this.htmlDecode(page))
               .join("");
  }

  /**
   * Chunks the provided string into a list of n parts of the specified length.
   * The length of the last element in the list will be <= the specified length.
   * @param str the string to chunk
   * @param length the length of the chunks
   */
  private chunk(str: string, length: number): string[] {
    return str.match(new RegExp(`.{1,${length}}`, "gi"));
  }

  private htmlDecode(input) {
    let doc = new DOMParser().parseFromString(input, "text/html");
    let input2 = doc.documentElement.textContent;
    let doc2 = new DOMParser().parseFromString(input2, "text/html");
    let str = `<div class="page" style="display:block;height:100%;margin-top:1em;border:1px solid red;-webkit-column-count: 2;-moz-column-count: 2;column-count: 2;-webkit-column-gap: balance;-moz-column-gap: balance;column-gap: balance;-webkit-column-gap: 0.33in;-moz-column-gap: 0.33in;column-gap: 0.33in;">${doc2.documentElement.innerText}</div>`;
    return doc2.documentElement.innerText = str;
  }

  // ==================== Showdown-plugins ====================
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

  static generateTocElement(headings: Array<Element>): HTMLElement {
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

  private static addSection(inserted, heading: Element, text): string {
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

import * as showdown from 'showdown';
import * as katex from 'katex';

import { Component, OnInit, ViewEncapsulation, ElementRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Observable, Observer } from '../../interfaces/observer-observable.interface';
import { DocumentService } from '../../services/document.service';
import { DocumentUpdate } from '../../document-update';
import { PreviewStyles } from './preview-style';

declare var AMTparseAMtoTeX;


@Component({
  selector: 'app-preview-area',
  templateUrl: './preview-area.component.html',
  styleUrls: ['./preview-area.component.scss', './pub.scss', './katex.css', './toc.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PreviewAreaComponent implements OnInit, Observer {
  private styleManager: PreviewStyles = new PreviewStyles();
  private converter: showdown.Converter;
  private pageHeight: number;
  private rawDocument: string = "";
  private compiledDocument: HTMLElement;

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
    this.rawDocument = this.paginate("");
  }

  update(subject: Observable, action: Object) {
    this.rawDocument = this.paginate(<string>action).replace(new RegExp("<br>", "g"), "\n");
  }

  /**
   * Runs the stored source code string through the markdown compiler and 
   * returns a html-structure that can be displayed in the view.
   */
  public get compileDocument(): SafeHtml {
    let p = document.querySelector(".page");
    if (p) {
      this.pageHeight = parseInt(window.getComputedStyle(p).height) - (parseInt(window.getComputedStyle(p).paddingTop) + parseInt(window.getComputedStyle(p).paddingBottom) + (12*5));
    }
    let dom = new DOMParser().parseFromString(this.rawDocument, "text/html");
    let pages = Array.from(dom.querySelectorAll(".page"));
    
    let str = pages.map((page, i) => {
      let self = this;
      return `<div class="page"> ${this.converter.makeHtml(page.innerHTML)}<span class="pageNumber">${i + 1}</span></div>`;
    }).join("");
    return this.domSanitizer.bypassSecurityTrustHtml(str);
  }

  private paginate(action: string): string {
    //let e = this.elem.nativeElement.querySelector("#document");
    let e = this.elem.nativeElement.querySelector(".page") || this.elem.nativeElement.querySelector("#document");
    /*let container = e.parentElement;
    let w = container.offsetWidth//parseInt(window.getComputedStyle(container).width)
    let frac = w / 793;
    let h = container.offsetHeight / (frac || 1);//parseInt(window.getComputedStyle(container).height) / frac;
    container.style.maxHeight = `${h}px`;*/
    return this.doPages(e, action);
  }

  private doPages(e: HTMLElement, str: string): string {
    e.innerHTML = str;
    //let containerHeight = parseInt(window.getComputedStyle(e.parentElement.parentElement).height);
    //let pageHeight = parseInt(window.getComputedStyle(e).height);
    return this.trim(<HTMLElement>e);
  }

  private trim(elem: HTMLElement): string {
    elem.innerHTML = elem.innerText.split("")
                                   .map(char => `<span>${char}</span>`)
                                   .join("");

    let height = elem.parentElement.parentElement.clientHeight;
    let width = elem.parentElement.parentElement.clientWidth;
    let clipped = "";
    let elements = Array.from(elem.querySelectorAll("span"));
    elements.forEach((e, i) => {
      if (e.offsetTop > (this.pageHeight - 16 - (12 * 3))) { // Subtract line height and bottom margin 3em
        clipped += e.innerText;
      }
    });
    let str = elem.innerHTML.replace(/<span>/g, "").replace(/<\/span>/g, "");
    let pageLength = str.length - clipped.length;
    return this.chunk(str, pageLength)
               .map(content => this.wrapInPageDiv(content))
               .join("");
  }

  /**
   * Chunks the provided string into a list of parts with the specified length.
   * The length of the last element in the list will be <= the specified length.
   * @param str the string to chunk
   * @param length the length of the chunks
   */
  private chunk(str: string, length: number): string[] {
    return (length < str.length) ? str.match(new RegExp(`(.|[\r\n]){1,${length || 1}}`, "gi")) : [str];
  }

  private wrapInPageDiv(input) {
    let div = document.createElement("div");
    let footer = document.createElement("div");
    footer.classList.add("footer");
    div.classList.add("page");
    div.innerText = input;
    div.appendChild(footer);
    return div.outerHTML;
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

          var s = '<sup id="fnref:' + n + '" class="footnote">' +
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

          var s = '<li id="fn:' + n + '">' +
            '<p>' + content + '<a href="#fnref:' + n +
            '" title="return to article"></a>' +
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
        let dom = new DOMParser().parseFromString(text, "text/html");
        if (dom.querySelector(".footnotes")) {
          dom.querySelector(".footer").appendChild(dom.querySelector(".footnotes"));
        }
        return dom.body.innerHTML;
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

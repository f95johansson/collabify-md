// display:block;height:100%;margin-top:1em;border:1px solid red;-webkit-column-count: 2;-moz-column-count: 2;column-count: 2;-webkit-column-gap: balance;-moz-column-gap: balance;column-gap: balance;-webkit-column-gap: 0.33in;-moz-column-gap: 0.33in;column-gap: 0.33in;
import { ComponentStyle } from '../../component-style';

export class PreviewStyles extends ComponentStyle {
  // -webkit-column-gap: 0.33in;-moz-column-gap: 0.33in;column-gap: 0.33in;
  page = {
    display: "block",
    height: "100%",
    marginTop: "1em",
    padding: "4em 6em",
    boxShadow: "1px 1px 1px rgba(0,0,0,.6)",
    position: "relative",
    backgroundColor: "white",

    pageNumber: {
      position: "absolute",
      bottom: "3em",
      right: "4em",
    }
  }

  applyPageStyle(elem: HTMLElement): HTMLElement {
    return super.applyStyles(<HTMLElement>elem.cloneNode(true), this.page);
  }

  applyPageNumberStyle(elem: HTMLElement): HTMLElement {
    return super.applyStyles(<HTMLElement>elem.cloneNode(true), this.page.pageNumber);
  }
}
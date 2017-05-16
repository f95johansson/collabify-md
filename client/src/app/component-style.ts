export class ComponentStyle {
  
  /**
   * Applies the provided styles to the given element
   * @param element The element to style
   * @param styles The styles to apply
   */
  applyStyles(element: HTMLElement, styles): HTMLElement {
    let e = <HTMLElement>element.cloneNode(true);
    Object.keys(styles).forEach(function (key) {
  		e.style[key] = styles[key];
	  });
    return e;
  }
  
}
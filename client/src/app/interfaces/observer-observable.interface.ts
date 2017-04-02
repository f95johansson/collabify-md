/**
 * Decalares an interface that can be used as the observer part 
 * in compliance with the observer/observable designpattern 
 */
export interface Observer {
    update(subject: Observable, action: Object);
}

/**
 * Decalares an interface that can be used as the observable part 
 * in compliance with the observer/observable designpattern 
 */
export interface Observable {
    addObserver(observer: Observer);
}
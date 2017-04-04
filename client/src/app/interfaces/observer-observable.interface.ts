/**
 * Decalares an interface that can be used as the observer part 
 * in compliance with the observer/observable designpattern 
 */
export interface Observer {

    /**
     * Callback to invoke when the observable subject changes
     * @param subject the subject that changed
     * @param action the change made
     */
    update(subject: Observable, action: Object);
}

/**
 * Decalares an interface that can be used as the observable part 
 * in compliance with the observer/observable designpattern 
 */
export interface Observable {

    /**
     * Registers a new observer to receive updates from this observable
     * @param the observer to add
     */
    registerObserver(observer: Observer);
}
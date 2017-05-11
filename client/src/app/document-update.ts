export class DocumentUpdate {
    position: number;
    num_delete: number = 0;
    insert: string = "";
    version: number;
    received: number = new Date().getTime();

    constructor(data: Object = {}) {
        Object.assign(this, data);
    }

    /**
     * Applies this update to the provided string and
     * returns a new string that is the result of the
     * original string with the change applied.
     * @param source the string to apply update to
     */
    applyUpdate(source: string): string {
        let tmpStr = this.insertSubstring(source, this.insert, this.position);
        tmpStr = this.deleteSubstring(tmpStr, this.position, this.position + this.num_delete);
        return tmpStr;
    }

    /**
     * Inserts the substring into the source string.
     * A copy of the substring with the reflected 
     * changes is returned.
     * @param a the source string
     * @param b the string to insert
     * @param position the position to insert at
     */
    private insertSubstring(a:string, b:string, position: number): string {
        return a.substr(0, position) + b + a.substr(position);
    }

    /**
     * Removes a part of the string. A copy reflecting
     * the changes is returned.
     * @param str source string
     * @param start start position
     * @param end the end position
     */
    private deleteSubstring(str:string, start:number, end:number) {
        if (start > end) return str;
        return str.substring(0, start) + str.substring(end);
    }


    packForTransfer(version: number): string {
        return JSON.stringify(
        {   
            command: "submit", 
            transform: { // optional, must be used with submit command
                position: this.position,
                num_delete: this.num_delete,
                insert: this.insert,
                version: version, //"document version number, int, must be incremented from last known version",
            }, // (optional)
        }
        );
    }    
}

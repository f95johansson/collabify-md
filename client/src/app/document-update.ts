export class DocumentUpdate {
    position: number;
    num_delete: number;
    insert: string;
    version: number;
    received: number;

    constructor(data: Object = {}) {
        Object.assign(this, data);
    }
}

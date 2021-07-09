class IndexDBStorage {
    constructor(database="IndexDBStorage") {
        this.dbname  = database;
        this.isOpen = false;
    }

    async open(storeName="default") {
        // variable to control asyncronity.
        let threadEnd = false;

        this.storeName = storeName;
        this.request = (window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB).open(this.dbname, 1);

        this.request.onerror = (event) => {
            console.error(`Database error: ${event.target.errorCode}`);
            this.isOpen = false;
            threadEnd = true;
            throw `Database error: ${event.target.errorCode}`;
        };

        this.request.onupgradeneeded = (event) => {
            let db = event.target.result;
            let store = db.createObjectStore(storeName, {keyPath: "key"});
            store.createIndex('created', 'created', {unique: false});
        }

        this.request.onsuccess = (event) => {
            this._db = event.target.result;
            this.isOpen = true;
            threadEnd = true;
        };

        while (!threadEnd){await this._sleep();}
    }

    async setItem(key, value){
        // variable to control asyncronity.
        let threadEnd = false;

        // open a read/write db transaction, ready for adding the data.
        let transaction = this._db.transaction([this.storeName], "readwrite");

        // create an object store on the transaction.
        let objectStore = transaction.objectStore(this.storeName);

        // If exists remove previous item.
        let request = objectStore.delete(key);

        // Prepare the object to store the information.
        let object = new Object;
        object.key = key;
        object.value = value;
        object.created = Date.now();

        // Make a request to add our newItem object to the object store.
        let objectStoreRequest = objectStore.add(object);
        objectStoreRequest.onsuccess = function(event) { threadEnd = true; };
        objectStoreRequest.onerror = function(event) { threadEnd = true; throw `Database error: ${event.target.error}`;  };

        while (!threadEnd){await this._sleep();}
    }

    async getItem(key){
        // variable to control asyncronity.
        let threadEnd = false;
        
        // open a read/write db transaction, ready for adding the data.
        let transaction = this._db.transaction([this.storeName], "readonly");

        // create an object store on the transaction.
        let objectStore = transaction.objectStore(this.storeName);

        // Recover stored item.
        var objectStoreRequest = objectStore.get(key);
        objectStoreRequest.onsuccess = function(event) { threadEnd = true; };
        objectStoreRequest.onerror = function(event) { threadEnd = true; throw `Database error: ${event.target.error}`;  };
        while (!threadEnd){await this._sleep();}

        // Return recovered object
        return objectStoreRequest.result ? objectStoreRequest.result.value : null;
    }

    async removeItem(key){
        // variable to control asyncronity.
        let threadEnd = false;

        // open a read/write db transaction, ready for adding the data.
        let transaction = this._db.transaction([this.storeName], "readwrite");

        // create an object store on the transaction.
        let objectStore = transaction.objectStore(this.storeName);

        // Remove item. 
        let objectStoreRequest = objectStore.delete(key);
        objectStoreRequest.onsuccess = function(event) { threadEnd = true; };
        objectStoreRequest.onerror = function(event) { threadEnd = true; console.log (`IndexDBStorage.removeItem error: ${event.target.error}`);  };
        while (!threadEnd){await this._sleep();}
    }

    async clear(){
        // variable to control asyncronity.
        let threadEnd = false;

        // open a read/write db transaction, ready for adding the data.
        let transaction = this._db.transaction([this.storeName], "readwrite");

        // create an object store on the transaction.
        let objectStore = transaction.objectStore(this.storeName);

        // Clear whole store.
        let objectStoreRequest = objectStore.clear();
        objectStoreRequest.onsuccess = function(event) { threadEnd = true; };
        while (!threadEnd){await this._sleep();}
    }

    async purge(seconds=null){
        // variable to control asyncronity.
        let threadEnd = false;

        // Set time to live of the stored items. Convert to ms. 
        let ttl = seconds ? seconds : this.ttl;

        // If ttl is still null, no further actions are taken.
        if (!ttl) {return;}
        let keyRangeValue = IDBKeyRange.upperBound(Date.now() - (ttl*1000));

        // open a read/write db transaction, ready for adding the data.
        let transaction = this._db.transaction([this.storeName], "readwrite");

        // create an object store on the transaction.
        let objectStore = transaction.objectStore(this.storeName);

        // Clear whole store.
        objectStore.index('created').openCursor(keyRangeValue).onsuccess = function(event) {
            let cursor = event.target.result;
            if(cursor) {
                objectStore.delete(cursor.primaryKey);
                cursor.continue();
            }
            threadEnd = true; 
        };

        while (!threadEnd){await this._sleep();}
    }

    /**
    * No-op sleep to wait until timeout is over
    * @param {integer} timeout milliseconds to wait.
    * @returns A promise that finishes passed the timeout.
    */
    async _sleep(timeout=null){return new Promise(r => setTimeout(r, timeout));
    }
}
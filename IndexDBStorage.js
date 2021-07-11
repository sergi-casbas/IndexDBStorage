/**
 * Class to handle IndexedDB database like-as LocalStorage or SessionStorage.
 * This class uses asyncronous calls because IndexedDB API access are asyncronous
 * but they are internally re-sincronized and can be used at procedimental way prefixing it with 'await'.
 */
class IndexedDBStorage {
    /**
     * Initializes the indexedDBStorage class.
     * @param {string} database Optional. User-defined database name. If none is specified 'IndexedDBStorage' is used.
     */
    constructor(database="IndexedDBStorage") {
        this._db = {};
        this.dbname  = database;
        this.storeName = "default";
    }

    /**
     * Open the storage. This is the only operation not identically to Local/Sessino storage objects where the storage is implicitly open.
     * @param {string} storeName Optional. User-defined storage name. If none is specified 'default' is used.
     */
    async open(storeName="default") {
        // variable to control asyncronity.
        let threadEnd = false;

        // Initialize local variables.
        this.storeName = storeName;
        let indexedDB = (window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB).open(this.dbname, 1);

        indexedDB.onerror = (event) => {
            console.error(`Database error: ${event.target.errorCode}`);
            threadEnd = true;
            throw `Database error: ${event.target.errorCode}`;
        };

        indexedDB.onupgradeneeded = (event) => {
            let db = event.target.result;
            let store = db.createObjectStore(storeName, {keyPath: "key"});
            store.createIndex('created', 'created', {unique: false});
        };

        indexedDB.onsuccess = (event) => {
            this._db = event.target.result;
            threadEnd = true;
        };

        while (!threadEnd){await this._sleep();}
    }

    /**
     * Store a item in the browser IndexedDBStorage.
     * @param {string} key Indetificative key of he object to store.
     * @param {object} value Any kind of object to store.
     */
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
        let object = {};
        object.key = key;
        object.value = value;
        object.compression = false; // Future fla
        object.created = Date.now();

        // Make a request to add our newItem object to the object store.
        let objectStoreRequest = objectStore.add(object);
        objectStoreRequest.onsuccess = function(event) { threadEnd = true; };
        objectStoreRequest.onerror = function(event) { threadEnd = true; throw `Database error: ${event.target.error}`;  };

        while (!threadEnd){await this._sleep();}
    }

    /**
     * Recover a item from the browser IndexedDBStorage.
     * @param {string} key Indetificative key of he object to store. 
     * @returns The stored object if exists, null otherwise.
     */
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

    /**
     * Remove a item from the browser IndexedDBStorage.
     * @param {string} key Indetificative key of he object to remove. 
     */
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
        objectStoreRequest.onerror = function(event) { threadEnd = true; console.log (`IndexedDBStorage.removeItem error: ${event.target.error}`);  };
        while (!threadEnd){await this._sleep();}
    }

    /**
     * Remove all items from the browser IndexDBStorage.
     */
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

    /**
     * Purge items from the browser IndexDBStorage.
     * @param {integer} seconds Remove items older than 'seconds'.
     */
    async purge(seconds){
        // variable to control asyncronity.
        let threadEnd = false;

        // If seconds is null, no further actions are taken.
        if (!seconds) {return;}
        let keyRangeValue = IDBKeyRange.upperBound(Date.now() - (seconds*1000));

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
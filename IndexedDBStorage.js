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
    }

    /**
     * Open the storage. This is the only operation not identically to Local/Sessino storage objects where the storage is implicitly open.
     * @param {Array} storesName Optional. User-defined list of storage name. If none is specified 'default' will be used.
     * @param {integer} version Optional. Version of the database, usefull if you want to add stores after database creation.
     */
    async open(storesArray =["default"], version = 1){
        // variable to control asyncronity.
        let activeThread = true;

        // Open indexedDB database.
        let indexedDB = (window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB).open(this.dbname, version);

        // In case of error during opening, show an throw error message.
        indexedDB.onerror = (event) => {
            console.error(`Database error: ${event.target.errorCode}`);
            activeThread = false;
            throw `Database error: ${event.target.errorCode}`;
        };

        // Create tables if required.
        indexedDB.onupgradeneeded = (event) => {
            let db = event.target.result;

            for (let i=0; i<storesArray.length; i++)
            {
                // Only create stores in the array that doesn't exists previously.
				if (!db.objectStoreNames.contains(storesArray[i])){
                    let store = db.createObjectStore(storesArray[i], {keyPath: "key"});
                    store.createIndex('created', 'created', {unique: false});
                    store.createIndex('accessed', 'accessed', {unique: false});
                }
            }
        };

        // If everityhin is ok, store opened version.
        indexedDB.onsuccess = (event) => {
            this.version = version;
            this._db = event.target.result;
            activeThread = false;
        };

        // Wait until we have an active thread.
        while (activeThread){await this._sleep();}
    }

    /**
     * Store a item in the browser IndexedDBStorage.
     * @param {string} key Indetificative key of he object to store.
     * @param {object} value Any kind of object to store.
     * @param {string} store Optional. Name of the store to save the object.
     */
    async setItem(key, value, store='default'){
        // variable to control asyncronity.
        let threadEnd = false;

        // open a read/write db transaction, ready for adding the data.
        let transaction = this._db.transaction([store], "readwrite");

        // create an object store on the transaction.
        let objectStore = transaction.objectStore(store);

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
     * @param {string} key Indentificative key of he object to store. 
     * @param {string} store Optional. Name of the store where recover the object.
     * @returns The stored object if exists, null otherwise.
     */
    async getItem(key, store='default'){
        // variable to control asyncronity.
        let threadEnd = false;
        
        // open a read/write db transaction, ready for adding the data.
        let transaction = this._db.transaction([store], "readonly");

        // create an object store on the transaction.
        let objectStore = transaction.objectStore(store);

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
     * @param {string} store Optional. Name of the store where to remove the object.
     */
    async removeItem(key, store="default"){
        // variable to control asyncronity.
        let threadEnd = false;

        // open a read/write db transaction, ready for adding the data.
        let transaction = this._db.transaction([store], "readwrite");

        // create an object store on the transaction.
        let objectStore = transaction.objectStore(store);

        // Remove item. 
        let objectStoreRequest = objectStore.delete(key);
        objectStoreRequest.onsuccess = function(event) { threadEnd = true; };
        objectStoreRequest.onerror = function(event) { threadEnd = true; console.log (`IndexedDBStorage.removeItem error: ${event.target.error}`);  };
        while (!threadEnd){await this._sleep();}
    }

    /**
     * Remove all items from the browser IndexDBStorage.
     * @param {string} store Optional. Name of the store to clear.
     */
    async clear(store="default"){
        // variable to control asyncronity.
        let threadEnd = false;

        // open a read/write db transaction, ready for adding the data.
        let transaction = this._db.transaction([store], "readwrite");

        // create an object store on the transaction.
        let objectStore = transaction.objectStore(store);

        // Clear whole store.
        let objectStoreRequest = objectStore.clear();
        objectStoreRequest.onsuccess = function(event) { threadEnd = true; };
        while (!threadEnd){await this._sleep();}
    }

    /**
     * Purge items from the browser IndexDBStorage.
     * @param {integer} seconds Remove items older than 'seconds'.
     * @param {string} store Optional. Name of the store to purge.
     */
    async purge(seconds, store="default"){
        // variable to control asyncronity.
        let threadEnd = false;

        // If seconds is null, no further actions are taken.
        if (!seconds) {return;}
        let keyRangeValue = IDBKeyRange.upperBound(Date.now() - (seconds*1000));

        // open a read/write db transaction, ready for adding the data.
        let transaction = this._db.transaction([store], "readwrite");

        // create an object store on the transaction.
        let objectStore = transaction.objectStore(store);

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
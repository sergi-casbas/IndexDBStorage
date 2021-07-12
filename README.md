# IndexDBStorage
Modern browser storage emulating Local/Session storage but using IndexDB as data backend.

# How to use in three steps.
1. Create the instance of the class.
`var storage = new IndexedDBStorage();`
2. Open the storage syncroneously.
`await storage.open()`
3. Store anything.
`await storage.setItem(myKey, myObect);`

# Class functions.
## IndexedDBStorage.open()
Open the storage. This is the only operation not identically to Local/Sessino storage objects where the storage is implicitly open.
Optionaly supports user-defined storage name. If none is specified 'default' is used.

## IndexedDBStorage.setItem(key, value)
Store a item in the browser IndexedDBStorage.

· key Indentificative key of the object to store.

· value Any kind of object to store.

## IndexedDBStorage.getKey(key)
Recover a item from the browser IndexedDBStorage.

· key Indentificative key of the object to recover. 

## IndexedDBStorage.removeItem(key)
Remove a item from the browser IndexedDBStorage.

· key Indentificative key of the object to remove. 

## IndexedDBStorage.clear()
· Remove all items from the browser IndexDBStorage.

## IndexedDBStorage.purge(seconds)
Purge items from the browser IndexDBStorage.

· seconds Remove items older than 'seconds'.



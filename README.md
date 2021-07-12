# IndexDBStorage
Modern browser storage emulating Local/Session storage but using IndexDB as data backend.

# How to use in three steps.
1. Create the instance of the class.
`var storage = new IndexedDBStorage();`
2. Open the storage syncroneously.
`await storage.open()`
3. Store anything.
`await storage.setItem(myKey, myObect);`
3. Or recover anything.
`await storage.getItem(myKey)`



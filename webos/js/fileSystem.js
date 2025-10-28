/* IndexedDB-backed file system for WebOS */
const FileSystem = (function(){
  const DB = 'webos_fs_v1';
  const STORE = 'files';

  function openDB(){
    return new Promise((res,rej)=>{
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = (e)=>{
        const db = e.target.result;
        if(!db.objectStoreNames.contains(STORE)){
          const os = db.createObjectStore(STORE, {keyPath: 'id', autoIncrement: true});
          os.createIndex('by_path', 'path', {unique:false});
          os.createIndex('by_path_name', ['path','name'], {unique:true});
        }
      };
      req.onsuccess = (e)=> res(e.target.result);
      req.onerror = (e)=> rej(e.target.error);
    });
  }

  async function list(path='/'){
    const db = await openDB();
    return new Promise((res,rej)=>{
      const tx = db.transaction(STORE, 'readonly');
      const idx = tx.objectStore(STORE).index('by_path');
      const range = IDBKeyRange.only(path);
      const out = [];
      const req = idx.openCursor(range);
      req.onsuccess = (e)=>{
        const cur = e.target.result;
        if(cur){ out.push(cur.value); cur.continue(); }
        else res(out);
      };
      req.onerror = (e)=> rej(e.target.error);
    });
  }

  async function get(path='/', name){
    const db = await openDB();
    return new Promise((res,rej)=>{
      const tx = db.transaction(STORE, 'readonly');
      const idx = tx.objectStore(STORE).index('by_path_name');
      const req = idx.get([path, name]);
      req.onsuccess = (e)=> res(e.target.result || null);
      req.onerror = (e)=> rej(e.target.error);
    });
  }

  async function create(path='/', file){
    // file: {name, type, content}
    const existing = await get(path, file.name);
    if(existing) throw new Error('File exists');
    const db = await openDB();
    return new Promise((res,rej)=>{
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const now = Date.now();
      const rec = {path, name: file.name, type: file.type || 'text', content: file.content || '', created: now, modified: now};
      const req = store.add(rec);
      req.onsuccess = (e)=> res(rec);
      req.onerror = (e)=> rej(e.target.error);
    });
  }

  async function createFolder(path='/', name){
    const existing = await get(path, name);
    if(existing) throw new Error('Folder exists');
    // Create folder entry (type 'folder'). Children will have path = path + name + '/'
    return create(path, {name, type: 'folder', content: ''});
  }

  async function put(path='/', file){
    const db = await openDB();
    return new Promise((res,rej)=>{
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const idx = store.index('by_path_name');
      const getReq = idx.get([path, file.name]);
      getReq.onsuccess = (e)=>{
        const existing = e.target.result;
        const now = Date.now();
        if(existing){
          existing.content = file.content;
          existing.modified = now;
          const upd = store.put(existing);
          upd.onsuccess = ()=> res(existing);
          upd.onerror = (ev)=> rej(ev.target.error);
        } else {
          const rec = {path, name: file.name, type: file.type || 'text', content: file.content || '', created: now, modified: now};
          const add = store.add(rec);
          add.onsuccess = ()=> res(rec);
          add.onerror = (ev)=> rej(ev.target.error);
        }
      };
      getReq.onerror = (e)=> rej(e.target.error);
    });
  }

  async function remove(path='/', name){
    const db = await openDB();
    return new Promise((res,rej)=>{
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const idx = store.index('by_path_name');
      const getKeyReq = idx.getKey([path, name]);
      getKeyReq.onsuccess = (e)=>{
        const key = e.target.result;
        if(key == null){ res(false); return; }
        const del = store.delete(key);
        del.onsuccess = ()=> res(true);
        del.onerror = (ev)=> rej(ev.target.error);
      };
      getKeyReq.onerror = (e)=> rej(e.target.error);
    });
  }

  // Rename a file/folder within the same path
  async function rename(path='/', oldName, newName){
    if(!oldName || !newName) throw new Error('Invalid names');
    const db = await openDB();
    return new Promise((res,rej)=>{
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const idx = store.index('by_path_name');
      const getReq = idx.get([path, oldName]);
      getReq.onsuccess = async (e)=>{
        const rec = e.target.result;
        if(!rec){ rej(new Error('Not found')); return; }
        // check conflict
        const conflictReq = idx.get([path, newName]);
        conflictReq.onsuccess = (ce)=>{
          if(ce.target.result){ rej(new Error('Target name exists')); return; }
          rec.name = newName; rec.modified = Date.now();
          const upd = store.put(rec);
          upd.onsuccess = ()=> res(rec);
          upd.onerror = (ev)=> rej(ev.target.error);
        };
        conflictReq.onerror = (ev)=> rej(ev.target.error);
      };
      getReq.onerror = (e)=> rej(e.target.error);
    });
  }

  // Move an entry from one path to another
  async function move(pathFrom='/', name, pathTo='/'){
    if(!name) throw new Error('Invalid name');
    const db = await openDB();
    return new Promise((res,rej)=>{
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const idx = store.index('by_path_name');
      const getReq = idx.get([pathFrom, name]);
      getReq.onsuccess = (e)=>{
        const rec = e.target.result;
        if(!rec){ rej(new Error('Source not found')); return; }
        // check conflict at destination
        const conflictReq = idx.get([pathTo, name]);
        conflictReq.onsuccess = (ce)=>{
          if(ce.target.result){ rej(new Error('Target already exists')); return; }
          rec.path = pathTo;
          rec.modified = Date.now();
          const upd = store.put(rec);
          upd.onsuccess = ()=> res(rec);
          upd.onerror = (ev)=> rej(ev.target.error);
        };
        conflictReq.onerror = (ev)=> rej(ev.target.error);
      };
      getReq.onerror = (e)=> rej(e.target.error);
    });
  }

  return {list,create,get,put,remove,createFolder,rename,move};
})();

export default FileSystem;
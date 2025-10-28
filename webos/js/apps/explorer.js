import WindowManager from '../windowManager.js';
import FileSystem from '../fileSystem.js';
import NotesApp from './notes.js';
import PaintApp from './paint.js';

const ExplorerApp = (function(){
  async function open(){
    WindowManager.createWindow({title:'Files',width:700,height:480,content:async (el)=>{
      const container = document.createElement('div'); container.className = 'explorer-root';
      const toolbar = document.createElement('div'); toolbar.className = 'explorer-toolbar';
      const breadcrumb = document.createElement('div'); breadcrumb.className = 'explorer-breadcrumb';
      const btnNew = document.createElement('button'); btnNew.textContent = 'New Text File';
      const btnFolder = document.createElement('button'); btnFolder.textContent = 'New Folder';
      const btnUpload = document.createElement('button'); btnUpload.textContent = 'Upload Image';
      const btnSample = document.createElement('button'); btnSample.textContent = 'Load Sample Files';
      const list = document.createElement('div'); list.className = 'explorer-list';
      toolbar.append(breadcrumb, btnNew, btnFolder, btnUpload, btnSample);
      container.appendChild(toolbar); container.appendChild(list);
      el.appendChild(container);

      let currentPath = '/';

      function renderBreadcrumb(){
        breadcrumb.innerHTML = '';
        const parts = currentPath.split('/').filter(Boolean);
        const rootCrumb = document.createElement('span'); rootCrumb.textContent = '/'; rootCrumb.className='crumb';
        rootCrumb.addEventListener('click', ()=>{ navigateTo('/'); });
        breadcrumb.appendChild(rootCrumb);
        let acc = '/';
        parts.forEach((p,idx)=>{
          acc += p + '/';
          const span = document.createElement('span'); span.textContent = p; span.className='crumb';
          span.addEventListener('click', ()=>{ navigateTo(acc); });
          breadcrumb.appendChild(document.createTextNode(' / ')); breadcrumb.appendChild(span);
        });
      }

      // context menu for items
      const ctxMenu = document.createElement('div'); ctxMenu.className = 'explorer-context hidden';
      ctxMenu.innerHTML = `
        <div data-action="open">Open</div>
        <div data-action="rename">Rename</div>
        <div data-action="move">Move...</div>
        <div data-action="delete">Delete</div>
      `;
      container.appendChild(ctxMenu);

      async function refresh(){
        list.innerHTML = '';
        const files = await FileSystem.list(currentPath);
        if(files.length === 0) list.innerHTML = '<div class="empty">No files</div>';
        files.forEach(f => {
          const item = document.createElement('div'); item.className = 'explorer-item';
          item.innerHTML = `<div class="meta"><div class="name">${f.name}</div><div class="type">${f.type}</div></div>`;
          // double click to open
          item.addEventListener('dblclick', async ()=>{
            if(f.type === 'folder'){
              navigateTo((currentPath === '/' ? '/' + f.name + '/' : currentPath + f.name + '/'));
              return;
            }
            // open based on type
            if(f.type && f.type.startsWith('image')){
              // open in Paint app
              try{ await PaintApp.openImage(f); }catch(err){ console.error(err); }
            } else {
              try{ await NotesApp.openFile(f); }catch(err){ console.error(err); }
            }
          });
          const del = document.createElement('button'); del.textContent='Delete'; del.className='explorer-del';
          del.addEventListener('click', async ()=>{ await FileSystem.remove(currentPath, f.name); refresh(); });

          // context menu on right-click
          item.addEventListener('contextmenu', (ev)=>{
            ev.preventDefault();
            showContext(ev.clientX, ev.clientY, f);
          });
          item.appendChild(del);
          list.appendChild(item);
        });
      }

      function hideContext(){ ctxMenu.classList.add('hidden'); ctxMenu.style.left='0'; ctxMenu.style.top='0'; ctxMenu._target = null; }

      function showContext(pageX, pageY, file){
        ctxMenu.classList.remove('hidden');
        // position relative to explorer container
        const rect = el.getBoundingClientRect();
        ctxMenu.style.left = (pageX - rect.left) + 'px';
        ctxMenu.style.top = (pageY - rect.top) + 'px';
        ctxMenu._target = file;
      }

      // context menu actions
      ctxMenu.addEventListener('click', async (ev)=>{
        const action = ev.target.dataset.action; const file = ctxMenu._target; hideContext();
        if(!file) return;
        if(action === 'open'){
          if(file.type === 'folder') navigateTo((currentPath === '/' ? '/' + file.name + '/' : currentPath + file.name + '/'));
          else if(file.type && file.type.startsWith('image')) await PaintApp.openImage(file);
          else await NotesApp.openFile(file);
        } else if(action === 'rename'){
          const name = prompt('Rename to', file.name); if(!name) return; try{ await FileSystem.rename(currentPath, file.name, name); refresh(); }catch(err){ alert('Rename error: '+err.message); }
        } else if(action === 'move'){
          const to = prompt('Move to path (e.g. / or /docs/)', currentPath); if(!to) return; try{ await FileSystem.move(currentPath, file.name, to); refresh(); }catch(err){ alert('Move error: '+err.message); }
        } else if(action === 'delete'){
          try{ await FileSystem.remove(currentPath, file.name); refresh(); }catch(err){ alert('Delete error: '+err.message); }
        }
      });

      // hide context on click outside
      el.addEventListener('click', (ev)=>{ if(!ctxMenu.contains(ev.target)) hideContext(); });

      function navigateTo(path){ currentPath = path; renderBreadcrumb(); refresh(); }

      btnNew.addEventListener('click', async ()=>{
        const name = prompt('File name', 'untitled.txt'); if(!name) return;
        try{ await FileSystem.create(currentPath, {name, type:'text', content:''}); refresh(); }
        catch(err){ alert('Error: '+err.message); }
      });

      btnFolder.addEventListener('click', async ()=>{
        const name = prompt('Folder name', 'New Folder'); if(!name) return;
        try{ await FileSystem.create(currentPath, {name, type:'folder', content:''});
          // ensure child path exists implicitly; navigate into it
          refresh();
        }catch(err){ alert('Error: '+err.message); }
      });

      btnUpload.addEventListener('click', ()=>{
        const input = document.createElement('input'); input.type='file'; input.accept='image/*';
        input.addEventListener('change', async (ev)=>{
          const f = ev.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = async ()=>{
            try{ await FileSystem.create(currentPath, {name: f.name, type: f.type, content: reader.result}); refresh(); }
            catch(err){ alert('Upload error: '+err.message); }
          }; reader.readAsDataURL(f);
        }); input.click();
      });

      btnSample.addEventListener('click', async ()=>{
        // populate demo files
        try{
          // create folder
          await FileSystem.create('/', {name:'docs', type:'folder', content:''});
          await FileSystem.create('/docs/', {name:'welcome.txt', type:'text', content:'Welcome to WebOS!\nThis is a sample file.'});
          // sample image (small data URL placeholder)
          const sample = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="100%" height="100%" fill="#0f62fe"/><text x="50%" y="50%" fill="#fff" dominant-baseline="middle" text-anchor="middle">Sample</text></svg>');
          await FileSystem.create('/', {name:'sample.png', type:'image/svg+xml', content: sample});
          refresh();
        }catch(err){ console.error('Sample populate error', err); alert('Sample load error: '+err.message); }
      });

      renderBreadcrumb();
      refresh();
    }});
  }
  return {open};
})();

export default ExplorerApp;

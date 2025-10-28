import WindowManager from '../windowManager.js';

const TaskManagerApp = (function(){
  let listEl;
  function open(){
    WindowManager.createWindow({title:'Task Manager',width:480,height:360,content:(el)=>{
      const root = document.createElement('div'); root.className='taskmgr-root';
      listEl = document.createElement('div'); listEl.className='taskmgr-list';
      root.appendChild(listEl); el.appendChild(root);
      refresh();
      // listen for changes
      window.addEventListener('webos:window-opened', refresh);
      window.addEventListener('webos:window-closed', refresh);
      window.addEventListener('webos:window-focused', refresh);
    }});
  }
  function refresh(){
    if(!listEl) return;
    listEl.innerHTML = '';
    document.querySelectorAll('.window').forEach(w =>{
      const id = w.dataset.appId; const title = w.querySelector('.title')?.textContent || id;
      const row = document.createElement('div'); row.className='task-row'; row.innerHTML = `<div class="tmeta"><div class="tname">${title}</div><div class="tid">${id}</div></div>`;
      const btnKill = document.createElement('button'); btnKill.textContent='Force Close'; btnKill.addEventListener('click', ()=>{ try{ WindowManager.closeWindow(w); }catch(e){ console.error(e); } refresh(); });
      const btnFocus = document.createElement('button'); btnFocus.textContent='Focus'; btnFocus.addEventListener('click', ()=>{ WindowManager.focus(w); });
      row.appendChild(btnFocus); row.appendChild(btnKill); listEl.appendChild(row);
    });
  }
  return {open,refresh};
})();
export default TaskManagerApp;

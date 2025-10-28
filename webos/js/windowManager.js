/* Enhanced window manager: events, minimize/restore, snapping and nicer interactions */
const WindowManager = (function(){
  let topZ = 100;
  const windows = new Map();
  const desktop = document.getElementById('desktop');

  function emit(name, detail){
    window.dispatchEvent(new CustomEvent('webos:'+name, {detail}));
  }

  function createWindow({title='App',width=520,height=360,x=100,y=100,content=null,appId=null} = {}){
    const el = document.createElement('div');
    el.className = 'window';
    el.style.width = width + 'px';
    el.style.height = height + 'px';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.zIndex = ++topZ;
    el.dataset.appId = appId || '' + Date.now();

    el.innerHTML = `
      <div class="titlebar">
        <div class="title">${title}</div>
        <div class="controls">
          <button class="min">—</button>
          <button class="max">▢</button>
          <button class="close">✕</button>
        </div>
      </div>
      <div class="content"></div>
      <div class="resize-handle" aria-hidden="true"></div>
    `;

    const contentEl = el.querySelector('.content');
    if(typeof content === 'string') contentEl.innerHTML = content;
    else if(typeof content === 'function') content(contentEl);
    else if(content instanceof Node) contentEl.appendChild(content);

    desktop.appendChild(el);

    // wire controls
    el.querySelector('.close').addEventListener('click', ()=>{ closeWindow(el); });
    el.querySelector('.min').addEventListener('click', ()=>{ minimizeWindow(el); });
    el.querySelector('.max').addEventListener('click', ()=>{ toggleMax(el); });

    el.addEventListener('pointerdown', ()=>{ focus(el); emit('window-focused', {id: el.dataset.appId, title: title, el}); });

    // drag with snapping
    const titlebar = el.querySelector('.titlebar');
    titlebar.addEventListener('pointerdown', startDrag);
    titlebar.addEventListener('dblclick', ()=>{ toggleMax(el); });

    // resize
    const handle = el.querySelector('.resize-handle');
    handle.addEventListener('pointerdown', startResize);

    windows.set(el.dataset.appId, el);
    focus(el);
    emit('window-opened', {id: el.dataset.appId, title, el});

    return el;
  }

  function focus(el){
    topZ++;
    el.style.zIndex = topZ;
    el.classList.remove('minimized');
    delete el.dataset.minimized;
    emit('window-focused', {id: el.dataset.appId, el});
  }

  function closeWindow(el){
    if(!el) return;
    const id = el.dataset.appId;
    el.remove();
    windows.delete(id);
    emit('window-closed', {id});
  }

  function minimizeWindow(el){
    if(!el) return;
    el.classList.add('minimized');
    el.dataset.minimized = '1';
    emit('window-minimized', {id: el.dataset.appId, el});
  }

  function toggleMax(el){
    if(el.classList.contains('maxed')){
      el.style.width = el.dataset._w;
      el.style.height = el.dataset._h;
      el.style.left = el.dataset._x;
      el.style.top = el.dataset._y;
      el.classList.remove('maxed');
      emit('window-restored', {id: el.dataset.appId, el});
    } else {
      el.dataset._w = el.style.width;
      el.dataset._h = el.style.height;
      el.dataset._x = el.style.left;
      el.dataset._y = el.style.top;
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.width = window.innerWidth + 'px';
      el.style.height = (window.innerHeight - 46) + 'px';
      el.classList.add('maxed');
      emit('window-maximized', {id: el.dataset.appId, el});
    }
  }

  function startDrag(e){
    const titlebar = e.currentTarget;
    const el = titlebar.closest('.window');
    el.setPointerCapture(e.pointerId);
    titlebar.classList.add('grabbing');
    const startX = e.clientX; const startY = e.clientY;
    const rect = el.getBoundingClientRect();
    function move(ev){
      el.style.left = rect.left + (ev.clientX - startX) + 'px';
      el.style.top = rect.top + (ev.clientY - startY) + 'px';
    }
    function up(ev){
      el.releasePointerCapture(e.pointerId);
      titlebar.classList.remove('grabbing');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      // snapping behavior
      const r = el.getBoundingClientRect();
      const pad = 24;
      if(r.left <= pad){ // snap left
        el.style.left = '0px';
        el.style.top = '0px';
        el.style.width = (window.innerWidth/2) + 'px';
        el.style.height = (window.innerHeight - 46) + 'px';
      } else if(r.left + r.width >= window.innerWidth - pad){ // snap right
        el.style.left = (window.innerWidth/2) + 'px';
        el.style.top = '0px';
        el.style.width = (window.innerWidth/2) + 'px';
        el.style.height = (window.innerHeight - 46) + 'px';
      } else if(r.top <= pad){ // maximize
        toggleMax(el);
      }
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function startResize(e){
    const el = e.currentTarget.closest('.window');
    el.setPointerCapture(e.pointerId);
    const startX = e.clientX; const startY = e.clientY;
    const rect = el.getBoundingClientRect();
    function move(ev){
      const w = Math.max(200, rect.width + (ev.clientX - startX));
      const h = Math.max(120, rect.height + (ev.clientY - startY));
      el.style.width = w + 'px';
      el.style.height = h + 'px';
    }
    function up(ev){
      el.releasePointerCapture(e.pointerId);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  return {createWindow, closeWindow, focus, minimizeWindow, toggleMax};
})();

export default WindowManager;
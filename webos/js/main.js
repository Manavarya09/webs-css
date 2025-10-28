import WindowManager from './windowManager.js';
import NotesApp from './apps/notes.js';
import CalculatorApp from './apps/calculator.js';
import PaintApp from './apps/paint.js';
import TerminalApp from './apps/terminal.js';
import ExplorerApp from './apps/explorer.js';
import SettingsApp from './apps/settings.js';
import TaskManagerApp from './apps/taskmanager.js';
import Notifications from './notifications.js';
import UserManager from './userManager.js';
import ThemeManager from './themeManager.js';

// Boot simulation
const boot = document.getElementById('boot-screen');
const bootProgress = document.getElementById('boot-progress');
const login = document.getElementById('login-screen');
const desktop = document.getElementById('desktop');
const icons = document.getElementById('icons');
const tasklist = document.getElementById('tasklist');
const clock = document.getElementById('clock');
const contextMenu = document.getElementById('context-menu');
const startBtn = document.getElementById('start-btn');
// simple start menu
const startMenu = document.createElement('div'); startMenu.className='start-menu hidden'; startMenu.innerHTML = `
  <div data-action="open-files">Files</div>
  <div data-action="open-settings">Settings</div>
  <div data-action="open-taskmgr">Task Manager</div>
`;
document.body.appendChild(startMenu);
startBtn.addEventListener('click', (e)=>{ const r = startBtn.getBoundingClientRect(); startMenu.style.left = r.left + 'px'; startMenu.style.bottom = (window.innerHeight - r.top + 8) + 'px'; startMenu.classList.toggle('hidden'); });
startMenu.addEventListener('click', (e)=>{ const a = e.target.dataset.action; startMenu.classList.add('hidden'); if(a==='open-files') ExplorerApp.open(); if(a==='open-settings') SettingsApp.open(); if(a==='open-taskmgr') TaskManagerApp.open(); });

let bootPct = 0;
const bootInterval = setInterval(()=>{ bootPct += Math.random()*25; if(bootPct>=100) bootPct=100; bootProgress.style.width = bootPct+'%'; if(bootPct>=100){ clearInterval(bootInterval); setTimeout(()=>{ boot.classList.add('hidden'); showLoginOrDesktop(); },400); } }, 300);

function showLoginOrDesktop(){ const sess = UserManager.getSession(); if(sess && sess.user){ showDesktop(); } else { login.classList.remove('hidden'); } }

// login handlers
document.getElementById('login-btn').addEventListener('click', ()=>{
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value;
  const res = UserManager.login(u,p);
  const msg = document.getElementById('login-msg'); if(!res.ok){ msg.textContent = res.msg; } else { login.classList.add('hidden'); showDesktop(); }
});

document.getElementById('register-btn').addEventListener('click', ()=>{
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value;
  const res = UserManager.register(u,p);
  const msg = document.getElementById('login-msg'); if(!res.ok){ msg.textContent = res.msg; } else { login.classList.add('hidden'); showDesktop(); }
});

function showDesktop(){ desktop.classList.remove('hidden'); ThemeManager.apply(); populateIcons(); startClock(); }

function populateIcons(){ const apps = [
  {id:'notes',name:'Notes',action:()=>NotesApp.open()},
  {id:'calc',name:'Calculator',action:()=>CalculatorApp.open()},
  {id:'paint',name:'Paint',action:()=>PaintApp.open()},
  {id:'term',name:'Terminal',action:()=>TerminalApp.open()},
  {id:'explorer',name:'Files',action:()=>ExplorerApp.open()},
];
  icons.innerHTML='';
  apps.forEach(a=>{
    const el = document.createElement('div'); el.className='icon'; el.innerHTML = `<img src="assets/icons/${a.id}.png" alt="${a.name}"><div>${a.name}</div>`;
    el.addEventListener('dblclick', ()=>{ a.action(); addTaskItem(a.name); });
    icons.appendChild(el);
  });
}

function addTaskItem(name){ const t = document.createElement('div'); t.className='task-item'; t.textContent = name; tasklist.appendChild(t); }

// Improved taskbar integration: listen to window lifecycle events
window.addEventListener('webos:window-opened', (e)=>{
  const id = e.detail.id; const title = e.detail.title || 'App';
  // create task button
  const t = document.createElement('div'); t.className='task-item'; t.dataset.winId = id; t.textContent = title;
  t.addEventListener('click', ()=>{
    // attempt to find window and toggle minimized state / focus
    const win = document.querySelector(`.window[data-app-id="${id}"]`) || document.querySelector(`.window[data-app-id='${id}']`);
    if(!win) return;
    if(win.classList.contains('minimized')){ win.classList.remove('minimized'); win.dataset.minimized = '';
      win.style.zIndex = 9999; // bring to front
    } else {
      // if visible, bring to front
      win.style.zIndex = 9999;
    }
  });
  tasklist.appendChild(t);
});

window.addEventListener('webos:window-minimized', (e)=>{
  const id = e.detail.id; const btn = tasklist.querySelector(`[data-win-id='${id}']`);
  if(btn) btn.classList.add('active');
});
window.addEventListener('webos:window-closed', (e)=>{
  const id = e.detail.id; const btn = tasklist.querySelector(`[data-win-id='${id}']`);
  if(btn) btn.remove();
});
window.addEventListener('webos:window-focused', (e)=>{
  const id = e.detail.id; tasklist.querySelectorAll('.task-item').forEach(it=>it.classList.remove('focused'));
  const btn = tasklist.querySelector(`[data-win-id='${id}']`); if(btn) btn.classList.add('focused');
});

function startClock(){ function update(){ const d = new Date(); clock.textContent = d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); } update(); setInterval(update,60000); }

// context menu
document.addEventListener('contextmenu', (e)=>{ e.preventDefault(); contextMenu.style.left = e.pageX+'px'; contextMenu.style.top = e.pageY+'px'; contextMenu.classList.remove('hidden'); });
document.addEventListener('click', ()=>{ contextMenu.classList.add('hidden'); });
contextMenu.addEventListener('click', (e)=>{
  const a = e.target.dataset.action;
  if(a==='theme-dark') ThemeManager.setTheme('dark');
  if(a==='theme-light') ThemeManager.setTheme('light');
  if(a==='change-wallpaper'){
    const input = document.createElement('input'); input.type='file'; input.accept='image/*'; input.addEventListener('change',(ev)=>{
      const f = ev.target.files[0]; if(!f) return; const url = URL.createObjectURL(f); ThemeManager.setWallpaper(url);
    }); input.click();
  }
});

// small UX: notify on theme change
window.addEventListener('webos:theme-changed', (e)=>{ Notifications.notify('Theme updated'); });

// expose API for apps
// expose APIs for testing and external controls
window.WebOS = { WindowManager };
window.WebOS.apps = { ExplorerApp, NotesApp, PaintApp, CalculatorApp, TerminalApp, SettingsApp, TaskManagerApp };

// If opened with ?autotest=1, dynamically load and run the auto test runner
if(window.location.search && window.location.search.includes('autotest=1')){
  import('./auto_test.js').then(m=> m.runAutoTest()).catch(e=> console.error('AutoTest load failed', e));
}


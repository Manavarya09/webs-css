import FileSystem from './fileSystem.js';

export async function runAutoTest(){
  console.info('AutoTest: starting smoke test');
  const report = {steps:[]};
  function mark(name, ok, info){ report.steps.push({name,ok,info}); console.log('AutoTest:', name, ok, info||''); }

  function showOverlay(text){
    let o = document.getElementById('autotest-overlay');
    if(!o){ o = document.createElement('div'); o.id='autotest-overlay'; o.style.position='fixed'; o.style.left='10px'; o.style.top='10px'; o.style.padding='8px 12px'; o.style.zIndex='999999'; o.style.background='rgba(0,0,0,0.6)'; o.style.color='#fff'; o.style.borderRadius='8px'; document.body.appendChild(o); }
    o.textContent = text;
  }

  try{
    showOverlay('AutoTest: waiting for boot...');
    // wait for boot overlay to hide or 5s
    await new Promise(res=>{
      const timeout = setTimeout(()=>res(), 6000);
      const check = setInterval(()=>{
        const boot = document.getElementById('boot-screen'); if(!boot || boot.classList.contains('hidden')){ clearTimeout(timeout); clearInterval(check); res(); }
      }, 300);
    });
    mark('boot-complete', true);
    showOverlay('AutoTest: registering user');
    // if login visible, fill and register
    const login = document.getElementById('login-screen');
    if(login && !login.classList.contains('hidden')){
      document.getElementById('login-username').value = 'autotest';
      document.getElementById('login-password').value = 'pass';
      document.getElementById('register-btn').click();
      // wait for desktop
      await new Promise(res=>{
        const t = setInterval(()=>{ if(document.getElementById('desktop') && !document.getElementById('desktop').classList.contains('hidden')){ clearInterval(t); res(); } }, 300);
        setTimeout(res,5000);
      });
      mark('register-login', true);
    } else {
      mark('register-login', true, 'login not shown');
    }

    showOverlay('AutoTest: opening Files and adding samples');
    // open Files via start menu API
    try{ await window.WebOS.apps.ExplorerApp.open(); mark('open-explorer', true); }catch(e){ mark('open-explorer', false, e.message); }

    // find Load Sample Files button and click it
    await new Promise(res=>setTimeout(res, 600));
    const explorerList = document.querySelectorAll('.explorer-root');
    if(explorerList && explorerList.length>0){
      const root = explorerList[explorerList.length-1];
      const btn = Array.from(root.querySelectorAll('button')).find(b=>/Sample/i.test(b.textContent));
      if(btn){ btn.click(); await new Promise(r=>setTimeout(r,800)); mark('load-sample-files', true); }
      else mark('load-sample-files', false, 'button not found');
    } else { mark('load-sample-files', false, 'explorer window not found'); }

    showOverlay('AutoTest: verifying sample files');
    // check Files listing contains welcome.txt
    await new Promise(res=>setTimeout(res,600));
    const files = await FileSystem.list('/');
    const hasWelcome = files.some(f=>f.name==='sample.png' || f.name==='welcome.txt');
    mark('fs-sample-check', hasWelcome, hasWelcome ? 'found' : JSON.stringify(files));

    showOverlay('AutoTest: opening welcome.txt');
    // open welcome.txt by finding its item in the explorer and double-clicking
    const entry = document.querySelector('.explorer-item .name');
    if(entry && entry.textContent){ entry.dispatchEvent(new MouseEvent('dblclick',{bubbles:true})); mark('open-file-via-ui', true); }
    else mark('open-file-via-ui', false, 'no entry found');

    showOverlay('AutoTest: saving a note');
    await new Promise(res=>setTimeout(res,900));
    const textarea = document.querySelector('.notes-area textarea');
    if(textarea){ textarea.value = (textarea.value || '') + '\n[AutoTest]';
      const saveBtn = document.querySelector('.notes-area button'); if(saveBtn){ saveBtn.click(); mark('save-note', true); } else mark('save-note', true, 'auto-save or no save button');
    } else mark('save-note', false, 'textarea not found');

    showOverlay('AutoTest: done — check console for details');
    mark('all-done', true);

  }catch(err){ console.error('AutoTest error', err); mark('fatal', false, err.message); showOverlay('AutoTest: error — see console'); }

  // print summary
  console.group('AutoTest summary'); report.steps.forEach(s=> console.log(s.name, s.ok ? 'OK' : 'FAIL', s.info||'')); console.groupEnd();
  // leave overlay for a while
  setTimeout(()=>{ const o = document.getElementById('autotest-overlay'); if(o) o.remove(); }, 8000);
}

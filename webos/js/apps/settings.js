import WindowManager from '../windowManager.js';
import ThemeManager from '../themeManager.js';
import UserManager from '../userManager.js';

const SettingsApp = (function(){
  function open(){
    WindowManager.createWindow({title:'Settings',width:480,height:380,content:(el)=>{
      const s = ThemeManager.getSettings();
      const wrapper = document.createElement('div'); wrapper.className = 'settings-root';
      const user = document.createElement('div'); user.textContent = 'User: ' + (UserManager.getSession() ? UserManager.getSession().user : 'Guest');
      const themeLabel = document.createElement('label'); themeLabel.textContent = 'Theme: ';
      const sel = document.createElement('select'); const opt1 = document.createElement('option'); opt1.value='dark'; opt1.text='Dark'; const opt2 = document.createElement('option'); opt2.value='light'; opt2.text='Light'; sel.append(opt1,opt2);
      sel.value = (s.theme || 'dark');
      sel.addEventListener('change', ()=>{ ThemeManager.setTheme(sel.value); });

      const wpLabel = document.createElement('div'); wpLabel.textContent = 'Wallpaper: ';
      const wpPreview = document.createElement('div'); wpPreview.style.height='120px'; wpPreview.style.border='1px solid rgba(255,255,255,0.04)'; wpPreview.style.margin='8px 0'; wpPreview.style.backgroundSize='cover'; wpPreview.style.backgroundPosition='center';
      if(s.wallpaper) wpPreview.style.backgroundImage = `url(${s.wallpaper})`;
      const wpBtn = document.createElement('button'); wpBtn.textContent = 'Choose Image';
      wpBtn.addEventListener('click', ()=>{ const input = document.createElement('input'); input.type='file'; input.accept='image/*'; input.addEventListener('change',(ev)=>{ const f = ev.target.files[0]; if(!f) return; const url = URL.createObjectURL(f); ThemeManager.setWallpaper(url); wpPreview.style.backgroundImage = `url(${url})`; }); input.click(); });

      const logout = document.createElement('button'); logout.textContent='Sign out'; logout.addEventListener('click', ()=>{ UserManager.logout(); location.reload(); });

      wrapper.append(user, themeLabel, sel, wpLabel, wpPreview, wpBtn, logout);
      el.appendChild(wrapper);
    }});
  }
  return {open};
})();

export default SettingsApp;

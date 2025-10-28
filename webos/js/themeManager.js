/* Theme and wallpaper manager */
const ThemeManager = (function(){
  const KEY = 'webos_theme_v1';
  function _load(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{}'); }catch(e){ return {}; } }
  function _save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
  function setTheme(t){ const s = _load(); s.theme = t; _save(s); apply(); }
  function setWallpaper(url){ const s = _load(); s.wallpaper = url; _save(s); apply(); }
  function getSettings(){ return _load(); }
  function apply(){ const s = _load(); const theme = s.theme || 'dark'; document.documentElement.dataset.theme = theme; const wp = document.getElementById('wallpaper'); if(wp) wp.style.backgroundImage = s.wallpaper ? `url(${s.wallpaper})` : '';
    // update small UI details
    document.body.style.backgroundColor = 'transparent';
  }
  return {setTheme,setWallpaper,apply,getSettings};
})();
export default ThemeManager;
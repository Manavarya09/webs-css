/* Simple toast notification system */
const Notifications = (function(){
  let container;
  function ensure(){
    if(container) return container;
    container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); return container;
  }
  function notify(message, timeout=3500){
    const c = ensure();
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = message; c.appendChild(t);
    setTimeout(()=>{ t.style.opacity = '0'; t.style.transform = 'translateY(6px)'; setTimeout(()=>t.remove(),250); }, timeout);
    return t;
  }
  return {notify};
})();
export default Notifications;

import WindowManager from '../windowManager.js';
import FileSystem from '../fileSystem.js';
const TerminalApp = (function(){
  function open(){
    WindowManager.createWindow({title:'Terminal',width:560,height:360,content:(el)=>{
      const win = document.createElement('div'); win.className='term-window';
      const out = document.createElement('div'); out.className='term-output';
      const input = document.createElement('input'); input.className='term-input';
      win.appendChild(out); win.appendChild(input); el.appendChild(win);
      function println(t){ out.textContent += t + '\n'; out.scrollTop = out.scrollHeight; }
      println('Mini WebOS Terminal — type help');
      input.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter'){
          const cmd = input.value.trim(); input.value=''; println('$ '+cmd);
          const parts = cmd.split(' ');
          if(parts[0] === 'help') println('help, clear, ls, open <name>');
          else if(parts[0] === 'clear'){ out.textContent=''; }
          else if(parts[0] === 'ls'){
            (async ()=>{
              try{
                const files = await FileSystem.list('/'); println(JSON.stringify(files,null,2));
              }catch(err){ println('Error: '+err.message); }
            })();
          }
          else if(parts[0] === 'open'){
            println('open not implemented for this prototype');
          }
          else println('Unknown command');
        }
      });
    }});
  }
  return {open};
})();
export default TerminalApp;
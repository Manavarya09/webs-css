import WindowManager from '../windowManager.js';
import FileSystem from '../fileSystem.js';

const NotesApp = (function(){
  function open(){
    WindowManager.createWindow({title:'Notes',width:520,height:420,content:(el)=>{
      const wrapper = document.createElement('div'); wrapper.className='notes-area';
      const textarea = document.createElement('textarea'); textarea.placeholder='Write notes...';
      const id = 'note_default';
      // load
      textarea.value = localStorage.getItem('note:'+id) || '';
      textarea.addEventListener('input', ()=>{ localStorage.setItem('note:'+id, textarea.value); });
      wrapper.appendChild(textarea);
      el.appendChild(wrapper);
    }});
  }

  async function openFile(file){
    // file: {path,name,type,content}
    WindowManager.createWindow({title:file.name,width:520,height:420,content:(el)=>{
      const wrapper = document.createElement('div'); wrapper.className='notes-area';
      const textarea = document.createElement('textarea'); textarea.placeholder='Write notes...';
      textarea.value = file.content || '';
      const save = document.createElement('button'); save.textContent = 'Save'; save.style.marginTop='8px';
      save.addEventListener('click', async ()=>{
        try{ await FileSystem.put(file.path || '/', {name: file.name, content: textarea.value, type: 'text'}); alert('Saved'); }
        catch(err){ alert('Save error: '+err.message); }
      });
      wrapper.appendChild(textarea); wrapper.appendChild(save); el.appendChild(wrapper);
    }});
  }

  return {open, openFile};
})();
export default NotesApp;
import WindowManager from '../windowManager.js';
import FileSystem from '../fileSystem.js';
const PaintApp = (function(){
  function open(){
    WindowManager.createWindow({title:'Paint',width:640,height:480,content:(el)=>{
      const toolbar = document.createElement('div'); toolbar.className='paint-toolbar';
      const color = document.createElement('input'); color.type='color';
      const size = document.createElement('input'); size.type='range'; size.min=1; size.max=50; size.value=4;
      const clear = document.createElement('button'); clear.textContent='Clear';
      const canvas = document.createElement('canvas'); canvas.className='paint-canvas'; canvas.width=600; canvas.height=360;
      const ctx = canvas.getContext('2d'); ctx.fillStyle='white'; ctx.fillRect(0,0,canvas.width,canvas.height);
      toolbar.append(color,size,clear);
      el.appendChild(toolbar); el.appendChild(canvas);
      let drawing=false; canvas.addEventListener('pointerdown', (e)=>{ drawing=true; ctx.beginPath(); ctx.moveTo(e.offsetX,e.offsetY); });
      canvas.addEventListener('pointermove', (e)=>{ if(!drawing) return; ctx.lineWidth = size.value; ctx.strokeStyle = color.value; ctx.lineTo(e.offsetX,e.offsetY); ctx.stroke(); });
      canvas.addEventListener('pointerup', ()=>{ drawing=false; });
      clear.addEventListener('click', ()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='white'; ctx.fillRect(0,0,canvas.width,canvas.height); });
    }});
  }
  return {open};
})();

  // open an image file record (with data URL in content)
  async function openImage(file){
    WindowManager.createWindow({title:file.name,width:640,height:480,content:(el)=>{
      const toolbar = document.createElement('div'); toolbar.className='paint-toolbar';
      const color = document.createElement('input'); color.type='color';
      const size = document.createElement('input'); size.type='range'; size.min=1; size.max=50; size.value=4;
      const clear = document.createElement('button'); clear.textContent='Clear';
      const save = document.createElement('button'); save.textContent='Save';
      const canvas = document.createElement('canvas'); canvas.className='paint-canvas'; canvas.width=600; canvas.height=360;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = ()=>{ canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img,0,0); };
      img.src = file.content;

      toolbar.append(color,size,clear,save);
      el.appendChild(toolbar); el.appendChild(canvas);
      let drawing=false; canvas.addEventListener('pointerdown', (e)=>{ drawing=true; ctx.beginPath(); ctx.moveTo(e.offsetX,e.offsetY); });
      canvas.addEventListener('pointermove', (e)=>{ if(!drawing) return; ctx.lineWidth = size.value; ctx.strokeStyle = color.value; ctx.lineTo(e.offsetX,e.offsetY); ctx.stroke(); });
      canvas.addEventListener('pointerup', ()=>{ drawing=false; });
      clear.addEventListener('click', ()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); });
      save.addEventListener('click', async ()=>{
        try{
          const data = canvas.toDataURL('image/png');
          await FileSystem.put(file.path || '/', {name: file.name, content: data, type: 'image/png'});
          alert('Saved');
        }catch(err){ alert('Save error: '+err.message); }
      });
    }});
  }

  export default PaintApp;

  // keep exported API
  PaintApp.openImage = openImage;
import WindowManager from '../windowManager.js';
const CalculatorApp = (function(){
  function open(){
    WindowManager.createWindow({title:'Calculator',width:320,height:420,content:(el)=>{
      const screen = document.createElement('div'); screen.className='calc-screen'; screen.textContent='0';
      const grid = document.createElement('div'); grid.className='calc-grid';
      const buttons = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'];
      let expr = '';
      buttons.forEach(b=>{
        const btn = document.createElement('button'); btn.className='calc-btn'; btn.textContent=b;
        btn.addEventListener('click', ()=>{
          if(b === '='){ try{ expr = String(Function('return '+expr)()); screen.textContent = expr; }catch(e){ screen.textContent='Err'; expr=''; } }
          else{ expr += b; screen.textContent = expr; }
        });
        grid.appendChild(btn);
      });
      el.appendChild(screen); el.appendChild(grid);
    }});
  }
  return {open};
})();
export default CalculatorApp;
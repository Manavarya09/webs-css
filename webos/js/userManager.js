/* Simple user manager using localStorage */
const UserManager = (function(){
  const KEY = 'webos_users_v1';
  const SESS = 'webos_session_v1';
  function _load(){ return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  function _save(u){ localStorage.setItem(KEY, JSON.stringify(u)); }

  function register(username,password){
    const users = _load();
    if(users[username]) return {ok:false,msg:'User exists'};
    users[username] = {password};
    _save(users);
    setSession(username);
    return {ok:true};
  }
  function login(username,password){
    const users = _load();
    if(users[username] && users[username].password === password){ setSession(username); return {ok:true}; }
    return {ok:false,msg:'Invalid credentials'};
  }
  function setSession(username){ localStorage.setItem(SESS, JSON.stringify({user:username})); }
  function getSession(){ try{ return JSON.parse(localStorage.getItem(SESS)); }catch(e){return null} }
  function logout(){ localStorage.removeItem(SESS); }
  return {register,login,setSession,getSession,logout};
})();
export default UserManager;
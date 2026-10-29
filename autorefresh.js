/* Aurrera Running: Supabase Realtime (Postgres Changes).
 * No external runtime dependency, no private credentials in source.
 * Events only trigger a fresh RLS-protected REST synchronization. */
(function(){
  'use strict';
  const RETRY_MS=[1500,3000,6000,12000,30000];
  let socket=null, owner='', endpoint='', channel='', joinRef='';
  let running=false, connecting=false, live=false, seq=0, failures=0;
  let retryTimer=null, heartbeatTimer=null, changeTimer=null, subscriptionIds=new Set(), tokenSent='';
  const enabled=()=>!!(state.session?.user?.id&&configReady());
  function updateIndicator(){
    const target=document.getElementById('auto-sync-info');
    if(!target)return;
    if(!enabled())target.textContent='Inicia sesión para activar la sincronización entre dispositivos.';
    else if(live)target.textContent='En directo: tus entrenamientos se actualizan entre dispositivos automáticamente.';
    else target.textContent='Sincronización automática activada: comprobación cada 15 segundos y reconexión cuando sea posible.';
    target.dataset.live=live?'true':'false';
  }
  function clearTimers(){
    clearTimeout(retryTimer);retryTimer=null;
    clearTimeout(changeTimer);changeTimer=null;
    clearInterval(heartbeatTimer);heartbeatTimer=null;
  }
  function detachSocket(){
    const old=socket;socket=null;live=false;subscriptionIds.clear();
    clearInterval(heartbeatTimer);heartbeatTimer=null;
    if(old){old.onopen=old.onmessage=old.onerror=old.onclose=null;try{old.close();}catch{}}
    updateIndicator();
  }
  function stop(){
    running=false;connecting=false;clearTimers();detachSocket();owner='';endpoint='';channel='';joinRef='';
  }
  function scheduleReconnect(){
    if(!running||!enabled()||retryTimer)return;
    live=false;updateIndicator();
    const wait=RETRY_MS[Math.min(failures++,RETRY_MS.length-1)];
    retryTimer=setTimeout(()=>{retryTimer=null;connect();},wait);
  }
  function send(sock,event,payload,topic,refJoin){
    if(sock!==socket||sock.readyState!==WebSocket.OPEN)return false;
    try{
      sock.send(JSON.stringify({
        topic:topic||channel,event,payload:payload||{},
        ref:String(++seq),join_ref:refJoin===undefined?joinRef:refJoin
      }));
      return true;
    }catch{return false;}
  }
  function requestUpdate(){
    if(!running||!enabled())return;
    clearTimeout(changeTimer);
    changeTimer=setTimeout(()=>{changeTimer=null;if(running&&enabled())syncCloud(true);},350);
  }
  function tokenUpdated(){
    if(!running||!enabled())return;
    const token=state.session.access_token||'';
    if(socket&&socket.readyState===WebSocket.OPEN&&joinRef&&token&&token!==tokenSent){
      if(send(socket,'access_token',{access_token:token})){tokenSent=token;}
    }else if(!socket&&!connecting)connect();
  }
  async function connect(){
    if(!running||connecting||!enabled()||typeof WebSocket==='undefined')return;
    if(socket&&[WebSocket.CONNECTING,WebSocket.OPEN].includes(socket.readyState))return;
    connecting=true;
    try{
      await ensureSession();
      if(!running||!enabled())return;
      if(socket&&[WebSocket.CONNECTING,WebSocket.OPEN].includes(socket.readyState))return;
      const uid=state.session.user.id;
      const url=state.config.url.replace(/^https:/,'wss:')+'/realtime/v1/websocket?apikey='+encodeURIComponent(state.config.key)+'&vsn=1.0.0';
      const sock=new WebSocket(url);
      socket=sock;
      owner=uid;endpoint=state.config.url;channel='realtime:aurrera-running-'+uid;
      joinRef='';subscriptionIds.clear();live=false;tokenSent='';updateIndicator();
      sock.onopen=()=>{
        if(sock!==socket||!enabled()||state.session.user.id!==owner){try{sock.close();}catch{}return;}
        const ref=String(++seq);joinRef=ref;
        const changeFilter='user_id=eq.'+owner;
        const payload={
          config:{
            broadcast:{ack:false,self:false},presence:{enabled:false},private:false,
            postgres_changes:[
              {event:'INSERT',schema:'public',table:'running_entries',filter:changeFilter},
              {event:'UPDATE',schema:'public',table:'running_entries',filter:changeFilter}
            ]
          },
          access_token:state.session.access_token
        };
        tokenSent=state.session.access_token;
        try{sock.send(JSON.stringify({topic:channel,event:'phx_join',payload,ref,join_ref:ref}));}
        catch{try{sock.close();}catch{}return;}
        heartbeatTimer=setInterval(()=>send(sock,'heartbeat',{},'phoenix',null),20000);
      };
      sock.onmessage=e=>{
        if(sock!==socket||!running||!enabled())return;
        let message;
        try{message=JSON.parse(e.data);}catch{return;}
        if(!message||message.topic!==channel)return;
        if(message.event==='phx_reply'&&String(message.ref)===joinRef){
          const changes=message.payload?.response?.postgres_changes;
          if(message.payload?.status==='ok'&&Array.isArray(changes)&&changes.length>=2){
            subscriptionIds=new Set(changes.map(x=>String(x.id)));
            live=true;failures=0;updateIndicator();
            requestUpdate(); // catch changes made while the socket was connecting
          }else{
            live=false;updateIndicator();
            try{sock.close();}catch{}
          }
        }else if(message.event==='postgres_changes'){
          const payload=message.payload||{},data=payload.data||{};
          if(data.schema!=='public'||data.table!=='running_entries')return;
          if(data.type!=='INSERT'&&data.type!=='UPDATE')return;
          if(!Array.isArray(payload.ids)||!payload.ids.some(x=>subscriptionIds.has(String(x))))return;
          if(data.record?.user_id&&data.record.user_id!==owner)return;
          requestUpdate(); // always re-query via the existing, RLS-protected REST endpoint
        }else if(message.event==='phx_error'||message.event==='phx_close'||(message.event==='system'&&message.payload?.status==='error')){
          live=false;updateIndicator();try{sock.close();}catch{}
        }
      };
      sock.onerror=()=>{if(sock===socket){live=false;updateIndicator();}};
      sock.onclose=()=>{
        if(sock!==socket)return;
        socket=null;live=false;subscriptionIds.clear();
        clearInterval(heartbeatTimer);heartbeatTimer=null;updateIndicator();
        scheduleReconnect();
      };
    }catch{
      detachSocket();scheduleReconnect();
    }finally{connecting=false;}
  }
  function start(){
    if(!enabled()){stop();return;}
    running=true;
    if(socket&&(owner!==state.session.user.id||endpoint!==state.config.url))detachSocket();
    if(socket&&[WebSocket.CONNECTING,WebSocket.OPEN].includes(socket.readyState)){tokenUpdated();updateIndicator();return;}
    connect();
  }
  window.AurreraAutoSync={
    start,stop,authChanged(){if(enabled()){start();tokenUpdated();}else stop();},
    isLive:()=>live,updateIndicator
  };
  // Supports automatic recovery after offline/online transitions and background tab suspension.
  window.addEventListener('online',start);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')start();});
  window.addEventListener('focus',()=>{if(enabled())start();});
  start();
})();
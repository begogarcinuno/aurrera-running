
/* Aurrera Running / Intervals.icu (read-only + confirm-to-import).
 * Public SPA: never commit or log an API key or OAuth token. */
(function () {
  'use strict';
  const ORIGIN = 'https://intervals.icu';
  const API = ORIGIN + '/api/v1/athlete/0/activities';
  const C_ID = 'aurrera.intervals.client_id.v1';
  const C_KEY = 'aurrera.intervals.session.api_key.v1';
  const C_SAVED_KEY = 'aurrera.intervals.remembered.api_key.v1';
  const C_REMEMBER_PREF = 'aurrera.intervals.remember.preference.v1';
  const C_TOKEN = 'aurrera.intervals.session.oauth_token.v1';
  const C_FLOW = 'aurrera.intervals.pkce.flow.v1';
  // Migrate an already-verified personal key from an open tab to permanent
  // storage after the user requested to remember this connection.
  const previousSessionKey = sessionStorage.getItem(C_KEY) || '';
  const previouslyRemembered = localStorage.getItem(C_SAVED_KEY) || '';
  const canMigrate = !!previousSessionKey && !previouslyRemembered &&
    localStorage.getItem(C_REMEMBER_PREF) !== 'session-only' &&
    !sessionStorage.getItem(C_TOKEN);
  if (canMigrate) localStorage.setItem(C_SAVED_KEY, previousSessionKey);
  const icu = {
    clientId: localStorage.getItem(C_ID) || '',
    key: previousSessionKey || localStorage.getItem(C_SAVED_KEY) || '',
    token: sessionStorage.getItem(C_TOKEN) || '',
    runs: [], stravaStubs: 0, loading: false, lastSync: null, error: '', notice: '',
    loaded: false
  };
  // Keep the restored credential available for reloads while this tab remains open,
  // including after switching from persistent storage back to session-only mode.
  if (icu.key && !icu.token && !previousSessionKey) sessionStorage.setItem(C_KEY,icu.key);
  const escape = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const kmStr = n => Number(n).toLocaleString('es-ES', {maximumFractionDigits:1});
  const connected = () => !!(icu.token || icu.key);
  const isRemembered = () => !!icu.key && !icu.token && localStorage.getItem(C_SAVED_KEY) === icu.key;
  const method = () => icu.token ? 'OAuth (PKCE) · sesión' : isRemembered() ? 'Clave personal · recordada' : 'Clave personal · sesión';
  const redirectUri = () => location.origin + location.pathname;
  const formatTime = sec => {
    const x = Math.max(0, Math.round(Number(sec) || 0));
    if (x >= 3600) return Math.floor(x/3600) + ':' + String(Math.floor(x%3600/60)).padStart(2,'0') + ':' + String(x%60).padStart(2,'0');
    return Math.floor(x/60) + ':' + String(x%60).padStart(2,'0');
  };
  const formatPace = (seconds, kilometers) => seconds > 0 && kilometers > 0 ? formatTime(Math.round(seconds / kilometers)) + '/km' : '—';
  const dateLabel = d => new Intl.DateTimeFormat('es-ES', {day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
  const safeUrl = 'https://intervals.icu/settings/connections';
  function sessionError(err) {
    const message = err && err.message ? err.message : String(err || 'Error desconocido');
    icu.error = message.length > 210 ? message.slice(0,210) + '…' : message;
  }
  function authHeaders(k, t) {
    const token = t === undefined ? icu.token : t;
    const key = k === undefined ? icu.key : k;
    return {Authorization:token ? 'Bearer ' + token : 'Basic ' + btoa('API_KEY:' + key),Accept:'application/json'};
  }
  function parseActivity(activity) {
    const date = String(activity.start_date_local || activity.start_date || '').slice(0,10);
    const distance = Number(activity.distance);
    const seconds = Number(activity.moving_time || activity.elapsed_time || 0);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(distance) || distance <= 0) return null;
    return {
      id:String(activity.id || ''), date, title:String(activity.name || activity.type || 'Entrenamiento'),
      kind:String(activity.type || ''), km:Math.round(distance/100)/10, seconds,
      elevation:Number(activity.total_elevation_gain || 0),
      hr:Number(activity.average_heartrate || 0)
    };
  }
  function normalizeData(rows) {
    const all = Array.isArray(rows) ? rows : [];
    icu.stravaStubs = all.filter(a => String(a.source || '').toUpperCase()==='STRAVA' && (!Number.isFinite(Number(a.distance)) || !Number(a.distance))).length;
    icu.runs = all.filter(a => ['Run','TrailRun','VirtualRun','TreadmillRun'].includes(a.type))
      .map(parseActivity).filter(Boolean)
      .filter(a => a.date >= PLAN.start && a.date <= PLAN.end)
      .sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    icu.loaded = true;
    icu.lastSync = new Date();
  }
  async function loadRuns(overrideKey, overrideToken) {
    if (icu.loading) return false;
    icu.loading = true; icu.error = ''; icu.notice = ''; refreshView();
    try {
      const query = new URLSearchParams({oldest:PLAN.start,newest:PLAN.end,limit:'500'});
      const response = await fetch(API + '?' + query.toString(), {
        method:'GET',headers:authHeaders(overrideKey,overrideToken),cache:'no-store',mode:'cors'
      });
      if (!response.ok) {
        if (response.status===401 || response.status===403) throw new Error('Intervals.icu ha rechazado las credenciales. Comprueba los permisos o vuelve a conectar.');
        if (response.status===429) throw new Error('Intervals.icu ha limitado temporalmente las consultas. Prueba más tarde.');
        throw new Error('Intervals.icu respondió con el código ' + response.status + '.');
      }
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error('La respuesta de Intervals.icu no contiene una lista de actividades.');
      normalizeData(rows);
      return true;
    } catch (err) {
      if (err instanceof TypeError) sessionError(new Error('No se pudo contactar con la API desde el navegador (red o CORS). Revisa tu conexión; si persiste, será necesario un intermediario seguro.'));
      else sessionError(err);
      return false;
    } finally {icu.loading = false; refreshView();}
  }
  async function connectPersonal() {
    const input = document.getElementById('icu-key');
    const key = input && input.value.trim();
    if (!key || key.length < 10) {icu.error='Introduce la clave personal generada en Developer Settings de Intervals.icu.';refreshView();return;}
    const ok = await loadRuns(key,'');
    if (ok) {
      icu.key=key; icu.token='';
      sessionStorage.setItem(C_KEY,key);sessionStorage.removeItem(C_TOKEN);
      const remember = document.getElementById('icu-remember')?.checked !== false;
      if (remember) {
        localStorage.setItem(C_SAVED_KEY,key);
        localStorage.removeItem(C_REMEMBER_PREF);
        icu.notice='Conexión verificada. Recordaré tu cuenta en este dispositivo cuando vuelvas a abrir la web.';
      } else {
        localStorage.removeItem(C_SAVED_KEY);
        localStorage.setItem(C_REMEMBER_PREF,'session-only');
        icu.notice='Conexión verificada para esta sesión del navegador.';
      }
      refreshView();
    }
  }
  function randomUrlSafe(size) {
    const bytes = crypto.getRandomValues(new Uint8Array(size));
    return Array.from(bytes, b => String.fromCharCode(b)).join('');
  }
  function base64Url(input) {
    const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
    return btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  async function startOAuth() {
    if (location.protocol !== 'https:' || !crypto.subtle) {icu.error='OAuth requiere HTTPS y un navegador compatible.';refreshView();return;}
    const id = String(document.getElementById('icu-client-id')?.value || icu.clientId).trim();
    if (!id) {icu.error='Introduce primero el Client ID de una aplicación OAuth aprobada.';refreshView();return;}
    icu.clientId=id;localStorage.setItem(C_ID,id);
    const verifier = base64Url(crypto.getRandomValues(new Uint8Array(64)));
    const challenge = base64Url(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
    const stateString = base64Url(crypto.getRandomValues(new Uint8Array(24)));
    sessionStorage.setItem(C_FLOW,JSON.stringify({state:stateString,verifier,clientId:id,created:Date.now()}));
    const qs = new URLSearchParams({
      client_id:id,redirect_uri:redirectUri(),scope:'ACTIVITY:READ',
      state:stateString,code_challenge:challenge,code_challenge_method:'S256'
    });
    location.assign(ORIGIN + '/oauth/authorize?' + qs.toString());
  }
  async function oauthCallback() {
    const query = new URLSearchParams(location.search);
    if (!query.has('code') && !query.has('error')) return false;
    const code = query.get('code'), returnedState=query.get('state'), error=query.get('error');
    history.replaceState(null,document.title,location.pathname+location.hash);
    state.tab='settings';refreshView();
    if (error) {icu.error='Intervals.icu no ha autorizado la conexión: ' + error;refreshView();return true;}
    let flow;
    try {flow=JSON.parse(sessionStorage.getItem(C_FLOW)||'null');}catch{flow=null;}
    sessionStorage.removeItem(C_FLOW);
    if (!flow || !returnedState || returnedState!==flow.state || Date.now()-flow.created>300000) {
      icu.error='La verificación de seguridad ha fallado o ha caducado. Inicia la conexión de nuevo.';
      refreshView();return true;
    }
    icu.loading=true;refreshView();
    try{
      const form = new URLSearchParams({client_id:flow.clientId,code:code,code_verifier:flow.verifier});
      const res=await fetch(ORIGIN+'/api/oauth/token',{method:'POST',mode:'cors',cache:'no-store',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});
      let responseData={};try{responseData=await res.json();}catch{}
      if(!res.ok||!responseData.access_token)throw new Error('No se ha podido canjear la autorización. Comprueba que la app está aprobada y configurada como cliente público PKCE.');
      const token=String(responseData.access_token);
      icu.token=token;icu.key='';icu.clientId=flow.clientId;
      sessionStorage.setItem(C_TOKEN,token);sessionStorage.removeItem(C_KEY);
      localStorage.removeItem(C_SAVED_KEY);
      icu.notice='Autorización OAuth completada. Permiso concedido: ACTIVITY:READ.';
    }catch(e){sessionError(e);}
    finally{icu.loading=false;refreshView();}
    if(icu.token)await loadRuns();
    return true;
  }
  function saveClientId(){
    const value=document.getElementById('icu-client-id')?.value.trim()||'';
    icu.clientId=value;localStorage.setItem(C_ID,value);
    icu.notice=value?'Client ID guardado en este navegador. No es un dato secreto.':'Client ID eliminado.';
    icu.error='';refreshView();
  }
  function rememberCurrentDevice() {
    if (!icu.key || icu.token) return;
    localStorage.setItem(C_SAVED_KEY,icu.key);
    localStorage.removeItem(C_REMEMBER_PREF);
    icu.notice='Este dispositivo recordará tu conexión al cerrar y volver a abrir el navegador.';
    icu.error='';refreshView();
  }
  function useCurrentSessionOnly() {
    localStorage.removeItem(C_SAVED_KEY);
    localStorage.setItem(C_REMEMBER_PREF,'session-only');
    icu.notice='La clave ya no quedará guardada. Seguirás conectada únicamente durante esta sesión.';
    icu.error='';refreshView();
  }
  function disconnect(){
    icu.key='';icu.token='';icu.runs=[];icu.lastSync=null;icu.loaded=false;icu.error='';icu.notice='Desconectado. He eliminado la clave guardada en este navegador sin cambiar tus entrenamientos.';
    sessionStorage.removeItem(C_TOKEN);sessionStorage.removeItem(C_KEY);
    localStorage.removeItem(C_SAVED_KEY);
    localStorage.removeItem(C_REMEMBER_PREF);
    refreshView();
  }
  function stats(){
    const total=icu.runs.reduce((n,r)=>n+r.km,0);
    const withTime=icu.runs.filter(r=>r.seconds>0);
    const totalKm=withTime.reduce((n,r)=>n+r.km,0);
    const totalSeconds=withTime.reduce((n,r)=>n+r.seconds,0);
    return {km:total,runs:icu.runs.length,pace:formatPace(totalSeconds,totalKm)};
  }
  function activityList(max) {
    if(!icu.loaded)return '<p class="icu-help">Al conectar tu cuenta verás aquí las carreras registradas entre el 29/10/2026 y el 14/02/2027.</p>';
    if(!icu.runs.length)return '<div class="icu-notice">No se han encontrado actividades de running con datos completos para estas fechas. Comprueba si Intervals.icu recibe actividades directamente de tu reloj o solo desde Strava.</div>';
    return '<div class="icu-activities">' + icu.runs.slice(0,max).map(run=>{
      const scheduled=DAY_MAP[run.date] && isRunning(DAY_MAP[run.date]);
      const done=scheduled && consideredDone(run.date);
      const subtitle=dateLabel(run.date)+' · '+kmStr(run.km)+' km · '+formatPace(run.seconds,run.km)+(run.elevation?' · +'+Math.round(run.elevation)+' m':'');
      const action=scheduled?'<button class="icu-btn secondary" data-icu-action="apply" data-icu-id="'+escape(run.id)+'">'+(done?'Revisar registro':'Registrar')+'</button>':'<span class="icu-footnote">Sin sesión prevista</span>';
      return '<div class="icu-activity"><div class="icu-activity-main"><strong>'+escape(run.title)+'</strong><small>'+escape(subtitle)+'</small></div>'+action+'</div>';
    }).join('')+'</div>';
  }
  function metrics(){
    const s=stats();
    return '<div class="icu-stats"><div class="icu-stat"><b>'+s.runs+'</b><small>Rodajes detectados</small></div><div class="icu-stat"><b>'+kmStr(s.km)+' km</b><small>Distancia real</small></div><div class="icu-stat"><b>'+escape(s.pace)+'</b><small>Ritmo global</small></div></div>';
  }
  function settingsCard(){
    const badge=connected()?'<span class="icu-badge ok">Conectado · '+escape(method())+'</span>':'<span class="icu-badge">Sin conectar</span>';
    let html='<section id="icu-panel" class="icu-card'+(icu.loading?' icu-loading':'')+'"><div class="icu-head"><div class="icu-brand"><div class="icu-mark">i</div><div><small>Fuente de datos deportivos</small><h3>Intervals.icu</h3></div></div>'+badge+'</div>';
    html+='<p class="icu-lead">Consulta las actividades registradas por tu reloj o plataforma deportiva y compáralas con tu plan de Aurrera. Importar una sesión requiere tu confirmación.</p>';
    if(icu.error)html+='<div class="icu-notice error" role="alert">'+escape(icu.error)+'</div>';
    if(icu.notice)html+='<div class="icu-notice" role="status">'+escape(icu.notice)+'</div>';
    if(connected()){
      html+=metrics();
      html+='<div class="icu-buttons"><button class="icu-btn" data-icu-action="sync" '+(icu.loading?'disabled':'')+'>'+(icu.loading?'Consultando…':'Actualizar mis entrenamientos')+'</button>';
      if(icu.key && !icu.token)html+='<button class="icu-btn secondary" data-icu-action="'+(isRemembered()?'session-only':'remember-device')+'">'+(isRemembered()?'Usar solo esta sesión':'Recordar en este dispositivo')+'</button>';
      html+='<button class="icu-btn ghost" data-icu-action="disconnect">Desconectar y borrar clave</button><a class="icu-inline-link" href="'+safeUrl+'" rel="noopener noreferrer" target="_blank">Mis conexiones en Intervals.icu ↗</a></div>';
      if(icu.key)html+='<div class="icu-notice">'+(isRemembered()?'<strong>Conexión recordada en este dispositivo.</strong> Puedes cerrar el navegador y volver a abrir Aurrera sin introducir de nuevo la clave.':'La clave se conserva solo durante la sesión actual.')+' <span>La clave personal se guarda sin cifrado adicional en el almacenamiento de este navegador, <strong>no en GitHub</strong>. Utiliza esta opción únicamente en dispositivos propios; cualquier persona o código con acceso a los datos del sitio podría utilizarla. No se comparte con otros dispositivos.</span></div>';
      if(icu.lastSync)html+='<p class="icu-footnote">Última consulta: '+escape(icu.lastSync.toLocaleString('es-ES'))+'. Solo lectura; no se envían entrenamientos a Intervals.icu.</p>';
      if(icu.stravaStubs)html+='<div class="icu-notice">Intervals.icu ha ocultado '+icu.stravaStubs+' actividad(es) importadas desde Strava por sus condiciones de API. Conecta tu dispositivo directamente en Intervals.icu para acceder a datos completos.</div>';
      html+='<div class="icu-section-name">Mis actividades de running</div>'+activityList(8);
    }else{
      html+='<div class="icu-section-name">Conectar ahora · clave personal</div>';
      html+='<div class="icu-form"><div><label for="icu-key">Clave API personal (solo en este navegador)</label><input type="password" id="icu-key" placeholder="Pega tu clave privada aquí, nunca en el chat ni en GitHub" autocomplete="off" spellcheck="false"></div><button class="icu-btn" data-icu-action="connect-key" '+(icu.loading?'disabled':'')+'>Conectar</button></div>';
      html+='<label class="icu-checkbox" for="icu-remember"><input type="checkbox" id="icu-remember" checked><span><strong>Mantener conectada mi cuenta en este dispositivo</strong><small>Se guarda la clave en el almacenamiento del navegador hasta que te desconectes o borres los datos del sitio.</small></span></label>';
      html+='<p class="icu-help">Genera tu clave en <a class="icu-inline-link" target="_blank" rel="noopener noreferrer" href="https://intervals.icu/settings">Intervals.icu → Settings → Developer Settings</a>. No se sube a GitHub ni a Supabase. Para mantener la sesión se almacena localmente sin cifrado adicional; hazlo solo en un dispositivo personal.</p>';
      html+='<div class="icu-division">O conexión con OAuth</div>';
      html+='<div class="icu-form"><div><label for="icu-client-id">Client ID de tu aplicación OAuth</label><input id="icu-client-id" placeholder="Client ID de una aplicación aprobada" autocomplete="off" spellcheck="false" value="'+escape(icu.clientId)+'"></div><button class="icu-btn secondary" data-icu-action="oauth" '+(icu.loading?'disabled':'')+'>Autorizar con Intervals.icu</button></div>';
      html+='<div class="icu-buttons"><button class="icu-btn ghost" data-icu-action="save-client-id">Guardar Client ID</button><a class="icu-inline-link" target="_blank" rel="noopener noreferrer" href="https://intervals.icu/oauth/apply">Solicitar aplicación OAuth ↗</a><a class="icu-inline-link" target="_blank" rel="noopener noreferrer" href="https://intervals.icu/settings/apps">Gestionar mis apps ↗</a></div>';
      html+='<ol class="icu-steps"><li>Solicita una aplicación llamada Aurrera Running y espera su aprobación.</li><li>En «Manage App», configura <b>Public client</b> y <b>Require PKCE</b>.</li><li>Registra exactamente esta URL de retorno: <code>'+escape(redirectUri())+'</code>.</li><li>Pega únicamente el <b>Client ID</b> en el campo anterior. No utilices ni compartas un Client Secret.</li></ol>';
    }
    return html+'<div class="icu-notice">Para obtener datos completos, revisa los dispositivos vinculados en <a class="icu-inline-link" href="'+safeUrl+'" target="_blank" rel="noopener noreferrer">Settings → Connections</a>. Las actividades importadas únicamente desde Strava pueden no estar disponibles para la API.</div></section>';
  }
  function compactCard(){
    if(!connected())return '<section id="icu-calendar-strip" class="icu-banner"><div><strong>Conecta tus entrenamientos reales</strong><p>Vincula Intervals.icu para consultar kilómetros, ritmos y desnivel de tus rodajes.</p></div><button class="icu-btn secondary" data-icu-action="open-settings">Conectar</button></section>';
    const s=stats();
    return '<section id="icu-calendar-strip" class="icu-banner"><div><strong>Intervals.icu conectado</strong><p>'+escape(icu.lastSync?'Última actualización: '+icu.lastSync.toLocaleString('es-ES'):'Tus sesiones reales junto al plan')+'</p></div><div class="icu-link-actions"><span class="icu-mini-pill">'+s.runs+' rodajes</span><span class="icu-mini-pill">'+kmStr(s.km)+' km</span><button class="icu-btn secondary" data-icu-action="sync">Actualizar</button></div></section>';
  }
  function progressCard(){
    return '<section id="icu-progress-strip" class="icu-card"><div class="icu-head"><div class="icu-brand"><div class="icu-mark">i</div><div><small>Datos importables</small><h3>Mis datos reales · Intervals.icu</h3></div></div>'+(connected()?'<span class="icu-badge ok">Cuenta vinculada</span>':'<span class="icu-badge">Sin conectar</span>')+'</div>'+
      (connected()?metrics()+ '<p class="icu-help">Estas estadísticas proceden de Intervals.icu y no cambian tus registros manuales hasta que pulses «Registrar».</p>'+activityList(10)+'<div class="icu-buttons"><button class="icu-btn secondary" data-icu-action="sync">Actualizar mis datos</button></div>':
      '<p class="icu-lead">Vincula Intervals.icu para ver tus rodajes reales y añadirlos al seguimiento de Aurrera.</p><button class="icu-btn" data-icu-action="open-settings">Configurar conexión</button>')+
      (icu.error?'<p class="icu-notice error">'+escape(icu.error)+'</p>':'')+'</section>';
  }
  function inject(){
    const root=document.getElementById('page-content');if(!root||typeof state==='undefined')return;
    if(state.tab==='settings'&&!root.querySelector('#icu-panel'))root.insertAdjacentHTML('afterbegin',settingsCard());
    if(state.tab==='calendar'&&!root.querySelector('#icu-calendar-strip'))root.insertAdjacentHTML('afterbegin',compactCard());
    if(state.tab==='progress'&&!root.querySelector('#icu-progress-strip'))root.insertAdjacentHTML('afterbegin',progressCard());
  }
  const originalRender = render;
  render = function(){originalRender();inject();};
  function refreshView(){if(typeof render==='function')render();}
  function applyRun(id){
    const r=icu.runs.find(a=>a.id===String(id));if(!r)return;
    const day=DAY_MAP[r.date];
    if(!day||!isRunning(day)){icu.error='No hay una sesión de running planificada en esa fecha. No se ha cambiado el calendario.';refreshView();return;}
    if(consideredDone(r.date)&&!window.confirm('Ya tienes una sesión completada el '+dateLabel(r.date)+'. ¿Quieres actualizar sus kilómetros y tiempo con los datos de Intervals.icu?'))return;
    const previous=entryFor(r.date);
    updateEntry(r.date,{
      status:'done',actual_km:r.km,
      result_time:r.seconds?formatTime(r.seconds):previous.result_time||'',
      note:previous.note||('Registrada desde Intervals.icu: '+r.title)
    });
    icu.notice='Sesión del '+dateLabel(r.date)+' registrada en Aurrera. Los otros datos manuales se han respetado.';
    refreshView();
  }
  document.addEventListener('click',async event=>{
    const el=event.target.closest('[data-icu-action]');if(!el)return;
    const action=el.dataset.icuAction;
    if(action==='open-settings'){switchTab('settings');return;}
    if(action==='connect-key'){await connectPersonal();return;}
    if(action==='save-client-id'){saveClientId();return;}
    if(action==='oauth'){await startOAuth();return;}
    if(action==='sync'){if(connected())await loadRuns();return;}
    if(action==='remember-device'){rememberCurrentDevice();return;}
    if(action==='session-only'){useCurrentSessionOnly();return;}
    if(action==='disconnect'){disconnect();return;}
    if(action==='apply'){applyRun(el.dataset.icuId);return;}
  });
  inject();
  (async()=>{
    const wasCallback=await oauthCallback();
    if(!wasCallback&&connected())await loadRuns();
  })();
})();

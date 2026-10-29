# Aurrera Running

Aplicación web de entrenamiento de running, con calendario visual, seguimiento de progreso y tres carreras como objetivos: Santurce-Bilbao (15 km, 29/11/2026), Etxebarri X-Treme (10 km trail, 06/12/2026) y Donosti 10K (14/02/2027).

La web principal se publica en **Vercel**: https://aurrera-running.vercel.app/. También se conserva la publicación mediante GitHub Pages. No necesitas servidor web, instalar Node.js ni compilar nada: `index.html` contiene toda la aplicación.

## 1. Crear el repositorio GitHub

1. Entra con tu cuenta en https://github.com/new .
2. **Repository name:** `aurrera-running` (puedes cambiarlo si lo prefieres).
3. **Visibility:** cambia a `Public` para habilitar Pages con GitHub Free.
4. No marques **Add a README** ni agregues una licencia en este paso; los archivos ya vienen incluidos.
5. Haz clic en **Create repository**.
6. En el repositorio se han cargado `index.html` y los archivos de configuración. Puedes comprobarlos en la rama principal.

## 2. Publicar con GitHub Pages

1. En el repositorio, abre **Settings > Pages**.
2. En **Build and deployment**, escoge **Source: Deploy from a branch**.
3. En **Branch**, selecciona `main` y `/(root)` y haz clic en **Save**.
4. Cuando GitHub indique que la web está publicada, abre el enlace que muestra la sección **Pages**.
5. Si mantienes el nombre del ejemplo, la URL tendrá este aspecto: `https://TU-USUARIO.github.io/aurrera-running/`. Sustituye `TU-USUARIO` por tu usuario real.

> **Importante:** la URL anterior es solo un ejemplo, no un enlace ya publicado. No es necesario crear un archivo llamado `CNAME` para usar el dominio normal de GitHub Pages.

La web utiliza rutas relativa## 3. Iniciar sesión y sincronizar entre el móvil y el ordenador

La aplicación está publicada en **https://aurrera-running.vercel.app/**. El proyecto de Supabase ya está configurado en la versión oficial y la tabla `public.running_entries` dispone de **RLS**: cada cuenta autenticada accede únicamente a sus propias sesiones de entrenamiento.

### Primer acceso

1. Abre https://aurrera-running.vercel.app/ en el ordenador.
2. Aparecerá una **pantalla de inicio de sesión**. Si todavía no tienes una cuenta, pulsa **Crear cuenta** e introduce tu correo y una contraseña segura.
3. Confirma tu correo si Supabase te lo solicita, vuelve a la web y pulsa **Iniciar sesión**.
4. Deja marcada **Mantener mi sesión iniciada** para que el navegador recuerde tu acceso al cerrar y volver a abrir la página.
5. Abre la **misma URL** en tu móvil y accede una vez con la misma cuenta, también marcando la casilla.
6. Marca un entrenamiento como completado en el móvil. **Sin pulsar ningún botón y sin recargar**, el ordenador abierto con la misma cuenta se actualiza mediante Supabase Realtime. Si se interrumpe el WebSocket, la web consulta Supabase automáticamente cada **15 segundos** mientras permanece visible y de nuevo al recuperar el foco.

**Sesión recordada:** cuando está marcada, Aurrera guarda el token de sesión y renovación en el almacenamiento local de ese navegador, **sin guardar tu contraseña**. Supabase puede invalidar la sesión por cierre, revocación o cambio de credenciales, en cuyo caso deberás iniciar sesión otra vez. Cada dispositivo recuerda su propia sesión. Desmarca la casilla en dispositivos compartidos.

**Solo esta sesión:** si desmarcas la casilla, Aurrera conserva los tokens en `sessionStorage` y normalmente solicitará las credenciales al iniciar una nueva sesión de navegador. Desde **Ajustes y nube** podrás cambiar la preferencia o cerrar la sesión en ese dispositivo.

**Sin cuenta:** la pantalla inicial permite **Continuar sin iniciar sesión**, pero en ese caso los entrenamientos se guardan solo en el navegador actual y no se sincronizan con Supabase.

### Actualización automática en tiempo real

Aurrera escucha los cambios de `public.running_entries` mediante un WebSocket de Supabase Realtime filtrado por `user_id`. Los cambios disparan una consulta REST protegida por las políticas RLS existentes; ningún dispositivo descarga los registros de otras cuentas. La publicación `supabase_realtime` debe incluir la tabla (el archivo [supabase_setup.sql](./supabase_setup.sql) ya incorpora la configuración).

**Respaldo:** hay una comprobación silenciosa cada 15 segundos cuando la web está visible y otra al volver al navegador o recuperar Internet. La conexión se recupera con reintentos automáticos y actualiza su JWT al renovar la sesión. Si dos dispositivos modifican un mismo entrenamiento casi simultáneamente, se conserva la versión con la marca `updated_at` más reciente.

**Edición sin interrupciones:** al consultar Supabase, la app no repinta toda la pantalla si no se han recibido cambios nuevos. Tampoco interrumpe la escritura en un campo activo. En **Ajustes y nube**, junto a tu usuario, se indica si la actualización está **En directo** o en el modo de comprobación automática.

Para usar la actualización en tiempo real, los dos dispositivos deben tener Internet y haber iniciado sesión con la misma cuenta. Los navegadores pueden suspender las webs en segundo plano; al volver a la pantalla, la aplicación se pone al día automáticamente.

### Cómo funciona

- **Vercel** sirve la web estática.
- **GitHub** contiene el código fuente del calendario.
- **Supabase** guarda las marcas y el histórico por usuario. Se utiliza la clave `sb_publishable_...` (pública) en el navegador, protegida con políticas RLS; **nunca** una clave `sb_secret_...` o `service_role`.
- **Intervals.icu** proporciona las actividades registradas por el reloj cuando están disponibles y se conecta de forma independiente.

Si necesitas recrear la tabla en un proyecto nuevo, ejecuta el archivo [supabase_setup.sql](./supabase_setup.sql) desde Supabase SQL Editor. Al usar otro proyecto, configura únicamente la URL HTTPS del proyecto y su clave publicable.

### Si ya tenías entrenamientos guardados en otra dirección

Las marcas locales de GitHub Pages y Vercel se guardan en orígenes distintos y no se copian automáticamente. Abre la web anterior y utiliza **Ajustes y nube → Exportar diario**. En la nueva web de Vercel, inicia sesión y utiliza **Importar diario** y después **Sincronizar ahora**. Conserva el archivo JSON como copia de seguridad.

**Correos de confirmación:** Supabase puede limitar el correo SMTP de prueba a direcciones del equipo del proyecto. Si no recibes el correo de registro, revisa la configuración de Auth/SMTP antes de repetir el registro.

Documentación: [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y [sesiones](https://supabase.com/docs/guides/auth/sessions).

## 4. Añadir al inicio del iPhone

Abre la URL de la web con Safari en tu iPhone y pulsa **Compartir > Añadir a pantalla de inicio**. A partir de entonces podrás abrirla desde el icono como una aplicación.

## Archivos principales

| Archivo | Función |
| --- | --- |
| `index.html` | Diseño, plan de running y diario interactivo |
| `manifest.webmanifest` | Datos para instalar la web en el móvil |
| `icon.svg` | Iconografía |
| `sw.js` | Guardado de recursos estáticos para funcionamiento sin conexión |
| `supabase_setup.sql` | Tabla y políticas de seguridad para sincronización |
| `.nojekyll` | Publicación estática directa en GitHub Pages |
| `assets/` | Vistas previas en el README |

Consulta la documentación oficial de [GitHub Pages](https://docs.github.com/es/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) y la de [Supabase URL Configuration](https://supabase.com/docs/guides/auth/redirect-urls) si necesitas ampliar detalles.


## Conexión con Intervals.icu

Aurrera Running incluye un panel Intervals.icu en Ajustes y nube y resúmenes en Calendario y Progreso. Consulta actividades de carrera y trail entre el 29/10/2026 y el 14/02/2027. Permite comprobar distancia, duración, ritmo y desnivel, y registrar cada actividad en el plan únicamente después de una confirmación.

### Vía rápida: clave API personal

1. Accede a https://intervals.icu/settings y busca Developer Settings.
2. Genera o consulta la clave API personal.
3. En Aurrera, abre Ajustes y nube → Intervals.icu, introduce la clave en el campo privado y pulsa Conectar.
4. Revisa el progreso o registra una actividad en el plan.

Persistencia: por defecto, al conectar una clave personal se marca **Mantener conectada mi cuenta en este dispositivo**. La clave permanece en `localStorage` de ese navegador después de cerrarlo, y los entrenamientos se consultan automáticamente al volver a entrar. Si había una conexión activa en `sessionStorage` cuando se despliega esta versión, se migra al almacenamiento persistente para no tener que pegar de nuevo la clave. En Ajustes puedes seleccionar **Usar solo esta sesión**, **Recordar en este dispositivo** o **Desconectar y borrar clave**.

**Seguridad:** esta opción guarda la clave sin cifrado adicional en el almacenamiento local del navegador, accesible a los scripts del sitio y a quien tenga acceso a ese perfil. Úsala solo en equipos propios; no la emplees en ordenadores compartidos. Puedes revocar o regenerar la clave desde Intervals.icu. La clave no está en GitHub, no se envía a Supabase ni se sincroniza con otros dispositivos. Si borras los datos del sitio, cambias de navegador o revocas la clave, tendrás que conectar de nuevo.

### Vía OAuth PKCE

Intervals.icu soporta OAuth para clientes públicos SPA desde el 22 de octubre de 2026:

1. Solicita una aplicación en https://intervals.icu/oauth/apply y espera su aprobación.
2. En https://intervals.icu/settings/apps, abre Manage App y activa Public Client y Require PKCE.
3. Registra como Redirect URI exacta: https://begogarcinuno.github.io/aurrera-running/
4. Copia solo el Client ID en Aurrera y pulsa Autorizar con Intervals.icu.

La aplicación pide únicamente ACTIVITY:READ; no escribe datos en Intervals.icu ni necesita client_secret.

### Restricciones y limitaciones

La API no proporciona todos los datos de actividades importadas únicamente desde Strava. Usa conexiones directas del reloj/dispositivo desde https://intervals.icu/settings/connections para tener acceso a las actividades permitidas. Los tokens OAuth se mantienen por sesión; las claves personales pueden recordarse únicamente en el navegador donde se autorizan. La sincronización de registros de Aurrera entre móvil y ordenador sigue requiriendo activar Supabase.

Fuentes oficiales:
- https://forum.intervals.icu/t/api-access-to-intervals-icu/609
- https://forum.intervals.icu/t/intervals-icu-oauth-support/2759

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

La web utiliza rutas relativa## 3. Sincronizar entrenamientos entre móvil y ordenador con Supabase

La web está publicada, pero guardar una marca en el navegador de tu teléfono no la copia al ordenador hasta que configures la base de datos. El código de sincronización ya está incluido: no es necesario instalar dependencias ni convertir el HTML en una aplicación diferente.

### Preparar el proyecto una sola vez

1. Accede a https://supabase.com/dashboard . Si ya tienes un proyecto para Aurrera, reutilízalo; de lo contrario, crea uno nuevo (por ejemplo `aurrera-running`). Utiliza una contraseña de base de datos robusta y guárdala en tu gestor de contraseñas. Esa contraseña **no** es la clave pública ni se introduce en Aurrera.
2. En el proyecto, abre **SQL Editor → New query** y pega íntegro el archivo [supabase_setup.sql](./supabase_setup.sql). Ejecuta **Run**. Se crea `public.running_entries` con seguridad Row Level Security (RLS): las cuentas autenticadas solo pueden consultar/modificar sus propios entrenamientos. No se concede acceso a los visitantes anónimos.
3. En el panel de Supabase abre **Connect** (o **Project Settings → API Keys**) y busca **Project URL** y **Publishable key** (`sb_publishable_...`). Copia solo esos dos datos públicos. Nunca copies la base de datos, un secreto `sb_secret_...` ni la `service_role` a una página web o repositorio.
4. En **Authentication → URL Configuration**, configura **Site URL** como `https://aurrera-running.vercel.app/`. Si mantienes también la web de GitHub Pages, puedes añadir `https://begogarcinuno.github.io/aurrera-running/` a **Redirect URLs**. Conserva activa la confirmación del correo electrónico.
5. Abre la web https://aurrera-running.vercel.app/ → **Ajustes y nube**. Pega la URL del proyecto y la clave **pública** y pulsa **Guardar conexión**. En el apartado **Tu cuenta personal**, regístrate con un correo y una contraseña nuevos para Aurrera. Confirma el correo si Supabase lo solicita; después inicia sesión.
6. Repite la configuración de URL y clave pública en el móvil o el ordenador que falte, entra con el **mismo correo y contraseña** y pulsa **Sincronizar ahora**. Cuando los datos estén sincronizados, las marcas se reflejarán en los dos.

**Importante:** la URL y clave pública se guardan por navegador. Si quieres evitar pegarlas dos veces, se pueden publicar como constantes en `index.html` porque **son públicas**, pero solo después de comprobar la seguridad RLS. Vercel no inyecta automáticamente variables de entorno en este HTML estático; guardar una variable en Vercel sin adaptar el código no funcionará.

**Correos de confirmación:** el servidor SMTP gratuito de prueba de Supabase puede enviar solo a direcciones de los miembros del equipo del proyecto y tiene límites estrictos. Para una primera cuenta personal, utiliza el correo con el que creaste el proyecto; si necesitas otras direcciones, configura un proveedor SMTP. No desactives la verificación de correos solo para eludir ese límite.

### Comprobación de que funciona

1. En el móvil, abre **Mi calendario** y marca una sesión como **Completada**.
2. Espera a que aparezca el indicador de sincronización completada o pulsa **Sincronizar ahora**.
3. En el ordenador, abre **exactamente** `https://aurrera-running.vercel.app/` con la misma cuenta de Aurrera y pulsa **Sincronizar ahora**.
4. Comprueba que el mismo entrenamiento aparece completado en el ordenador.

### Si ya tenías entrenamientos guardados en GitHub Pages

Los registros locales de GitHub Pages y los de Vercel viven en orígenes distintos del navegador; no se copian automáticamente. En la web antigua, abre **Ajustes y nube → Exportar diario**. En la web de Vercel, utiliza **Importar diario** y después **Sincronizar ahora**. Conserva el archivo JSON como copia de seguridad. **Intervals.icu** y **Supabase** tienen funciones diferentes: Intervals.icu consulta actividad registrada por dispositivos; Supabase sincroniza el calendario propio de Aurrera.

Documentación oficial: [Supabase: claves públicas](https://supabase.com/docs/guides/getting-started/api-keys), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y [URLs de autenticación](https://supabase.com/docs/guides/auth/redirect-urls).

e` están diseñadas para uso desde el navegador cuando las políticas RLS están bien configuradas.

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

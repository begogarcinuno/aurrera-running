# Aurrera Running

Aplicación web de entrenamiento de running, con calendario visual, seguimiento de progreso y tres carreras como objetivos: Santurce-Bilbao (15 km, 29/11/2026), Etxebarri X-Treme (10 km trail, 06/12/2026) y Donosti 10K (14/02/2027).

La web se publica con **GitHub Pages**. No necesitas servidor web, instalar Node.js ni compilar nada: `index.html` contiene toda la aplicación.

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

La web utiliza rutas relativas (`./...`) y funciona también cuando GitHub Pages la sirve desde la subcarpeta del repositorio.

## 3. Sincronizar los entrenamientos entre móvil y ordenador

**GitHub Pages aloja la web pero no guarda ni sincroniza tus entrenamientos.** Para ello se utiliza Supabase, que es opcional hasta que quieras sincronizar. Sin esta configuración, las marcas se guardan solo en el navegador actual.

1. Crea un proyecto en https://supabase.com/dashboard .
2. En Supabase > **SQL Editor**, ejecuta el contenido de `supabase_setup.sql`. Crea una tabla con seguridad por usuario (RLS).
3. En Supabase > **Project Settings / API Keys**, localiza **Project URL** y la clave **anon/publishable**.
4. Abre `index.html` en un editor y busca estas constantes:

   ```js
   const SUPABASE_URL = '';
   const SUPABASE_ANON_KEY = '';
   ```

   Sustituye los valores vacíos por la URL de tu proyecto y la clave **pública**. Guarda y vuelve a subir el `index.html` actualizado al repositorio (es un nuevo commit).
5. En Supabase > **Authentication > URL Configuration**, configura **Site URL** con la URL HTTPS exacta de tu web de GitHub Pages (por ejemplo `https://TU-USUARIO.github.io/aurrera-running/`). Si usas enlaces de confirmación o flujos con redirección, añade también esa URL a **Redirect URLs**.
6. En la web, abre **Ajustes y nube**, crea una cuenta con tu correo, confirma el email si te lo solicita e inicia sesión con la misma cuenta en móvil y ordenador.

Puedes introducir la URL y clave pública desde Ajustes y nube de la app en vez de editar el HTML, pero entonces deberás configurarlas en cada navegador por separado.

**Seguridad:** nunca pongas una `service_role`, `sb_secret_...`, contraseñas ni tokens de sesión en este repositorio. Aunque el repositorio sea privado, la web de GitHub Pages puede ser pública. Las claves `anon`/`publishable` están diseñadas para uso desde el navegador cuando las políticas RLS están bien configuradas.

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

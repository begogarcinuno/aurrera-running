# Aurrera Running

Aplicación web de entrenamiento de running, con calendario visual, seguimiento de progreso y tres carreras como objetivos: Santurce-Bilbao (15 km, 29/11/2026), Etxebarri X-Treme (10 km trail, 06/12/2026) y Donosti 10K (14/02/2027).

La web se publica con **GitHub Pages**. No necesitas servidor web, instalar Node.js ni compilar nada: `index.html` contiene toda la aplicación.

![Calendario en ordenador](assets/calendario-ordenador.png)

## 1. Crear el repositorio GitHub

1. Entra con tu cuenta en https://github.com/new .
2. **Repository name:** `aurrera-running` (puedes cambiarlo si lo prefieres).
3. **Visibility:** `Public` si utilizas GitHub Free y quieres usar Pages.
4. No marques **Add a README** ni agregues una licencia en este paso; los archivos ya vienen incluidos.
5. Haz clic en **Create repository**.
6. En la pantalla del repositorio vacío, utiliza el enlace **uploading an existing file**. Alternativamente, busca **Add file > Upload files**.
7. Descomprime el ZIP descargado y arrastra **los archivos y la carpeta `assets`**, no el ZIP cerrado, al área de subida.
8. Haz clic en **Commit changes**. Deben aparecer `index.html`, `sw.js`, `manifest.webmanifest`, `icon.svg`, los PNG y este `README.md` en la raíz del repositorio.

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
| `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | Iconografía |
| `sw.js` | Guardado de recursos estáticos para funcionamiento sin conexión |
| `supabase_setup.sql` | Tabla y políticas de seguridad para sincronización |
| `.nojekyll` | Publicación estática directa en GitHub Pages |
| `assets/` | Vistas previas en el README |

Consulta la documentación oficial de [GitHub Pages](https://docs.github.com/es/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) y la de [Supabase URL Configuration](https://supabase.com/docs/guides/auth/redirect-urls) si necesitas ampliar detalles.
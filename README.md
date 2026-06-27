# 🟧 Acopio

Plataforma web para **registrar y trazar centros de acopio de ayuda
humanitaria en Venezuela**, pensada para emergencias (terremoto 2025).
Es pública por defecto ( cualquiera puede ver sin login ), mobile first,
y con feed estilo Instagram.

- **Frontend:** React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query
- **Backend:** Supabase ( Auth · PostgreSQL + PostGIS · Storage · Realtime )
- **Routing:** react-router-dom
- **Geocodificación:** Nominatim ( OpenStreetMap )
- **Mapas:** link externo a Google Maps ( sin lib de mapas en el frontend )
- **Package manager:** [Bun](https://bun.sh) (no npm/yarn/pnpm)

---

## 📚 Documentación de referencia

Dos documentos en `/docs` son la fuente de verdad del producto y la arquitectura:

- **docs/PRD.md** — requisitos del producto, user stories y criterios de aceptación
- **docs/ARCHITECTURE.md** — decisiones técnicas, estructura de carpetas, queries SQL, RLS y escalabilidad

---

## 🚀 Setup del proyecto

### 1. Prerequisitos

- [Bun](https://bun.sh) >= 1.1
- Un proyecto en [Supabase](https://supabase.com) ( plan free alcanza )

> El **Supabase CLI** viene incluido como `devDependency` (`supabase@^2`):
> `bun install` lo baja a `node_modules/.bin/supabase`, así que los scripts
> `bun run supabase:*` lo usan automáticamente. No hace falta instalarlo global.
> Verificá con `bunx supabase --version`.

### 2. Instalar dependencias

```bash
bun install
```

### 3. Configurar variables de entorno

Copiá el archivo de ejemplo y completá con los datos de tu proyecto Supabase:

```bash
cp .env.example .env
```

Editá `.env` con tus valores:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

Los encontrás en: **Supabase Dashboard → Project Settings → API**.

### 4. Aplicar el schema con el Supabase CLI ( migraciones )

El schema vive en `supabase/migrations/` y se versiona. El flujo recomendado:

```bash
# 1) Autenticar el CLI ( una sola vez )
bunx supabase login    # abre el browser del dashboard

# 2) Linkar el repo local con tu proyecto remoto
#    ( ref = https://app.supabase.com/project/<ref>/settings/general )
export SUPABASE_PROJECT_REF=tu-project-ref
bun run supabase:link          # == supabase link --project-ref $SUPABASE_PROJECT_REF

# 3) Aplicar todas las migraciones pendientes al proyecto remoto
bun run supabase:push          # == supabase db push
```

La migración `00001_init.sql` aplica de una sola vez:
- extensiones `postgis` + `pgcrypto`
- tablas `centros_acopio` ( con columna `geom` generada + índice GIST ) y `posts`
- función RPC `centros_cercanos` ( orden por distancia PostGIS )
- **Row Level Security** + todas las políticas ( lectura pública, escritura por coordinador )
- bucket público `centros-fotos` + políticas de Storage
- **Realtime** para la tabla `posts`

El CLI trackea las migraciones aplicadas en una tabla `supabase_migrations`
en tu proyecto, así que las corre una sola vez y sabe qué falta.

#### Alternativa sin CLI ( manual )

Si querés arrancar rápido sin instalar nada, abrí el **SQL Editor** del
dashboard y pegá el contenido de `supabase/migrations/00001_init.sql`. El
script es **idempotente** ( `IF NOT EXISTS` / `OR REPLACE` / `DROP ... IF EXISTS` ),
así que es seguro correrlo dos veces. Recordá después instalar el CLI para
versionar los próximos cambios.

#### Verificar que el schema quedó aplicado

```sql
select
  (select count(*) from pg_extension where extname in ('postgis','pgcrypto'))          as extensiones,
  (select count(*) from information_schema.tables
     where table_schema='public' and table_name in ('centros_acopio','posts'))          as tablas,
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname='centros_cercanos')                        as rpc;
-- Esperado: extensiones=2, tablas=2, rpc=1
```

#### Confirmación de email ( Auth )

Supabase viene con **confirmación de email habilitada por defecto**. El flujo de la app ya lo contempla:

- **Registro** → si el proyecto exige confirmación, la app muestra una pantalla **"Revisá tu correo"** con el email del usuario, un botón **Reenviar correo** y un enlace para modificar los datos. Si el proyecto tiene confirmación desactivada, loguea y navega a `/` directamente.
- **Login** → si intentás entrar sin haber confirmado el correo, la app te avisa **"Confirmá tu correo"** y te deja reenviar el enlace desde la misma pantalla.

El `config.toml` del CLI local ya trae `enable_confirmations = true`. Para tu proyecto remoto, verificá que esté activado en **Dashboard → Authentication → Providers → Email → Confirm email**.

Cuando cambies el modelo (añadir una columna, ajustar una política, etc.):

```bash
# 1) Editá el schema en local ( o cambiá algo en local con `supabase start` )
# 2) Generá el diff como nueva migración
bun run supabase:diff add_fecha_cierre    # == supabase db diff -f add_fecha_cierre
#  ⇢ crea supabase/migrations/<n>_add_fecha_cierre.sql — revisalo antes de pushear

# 3) Aplicá al remoto
bun run supabase:push
```

Nuevo cambio en blanco ( archivo vacío para escribir a mano ):

```bash
bun run supabase:new nombre_cambio
```

#### ( Opcional ) Regenerar los tipos TypeScript desde el schema

El proyecto usa tipos escritos a mano en `src/types/db.ts`. Si querés
tipos generados desde el schema remoto ( recomendado en evolución ):

```bash
bun run supabase:types   # ⇒ src/types/database.generated.ts
# Luego en tsconfig podés mapearlos a tu cliente; o reemplazar db.ts.
```

### 5. Levantar el servidor de desarrollo

```bash
bun run dev
```

Abrí <http://localhost:5173/>.

---

## 🧪 Testing

### Stack de testing

- **Vitest** runner
- **@testing-library/react** para componentes
- **@testing-library/user-event** para interacciones
- **MSW ( Mock Service Worker )** para mockear Supabase REST, Auth y Storage
- **jsdom** como entorno

Todos los mocks de Supabase viven en `src/test/mocks/` ( handlers MSW, fixtures,
helpers ) y no se duplican por feature. **No se testea contra Supabase real**:
MSW intercepta todo.

### Comandos

```bash
bun run test           # corre todos los tests una vez
bun run test:watch     # modo watch
bun run test:coverage  # con cobertura ( >= 80 % en features/ y components/ )
```

### Cobertura

La configuración de cobertura ( `vite.config.ts` ) incluye una franquicia:
- `src/features/**` y `src/components/**` están medidos
- `src/components/ui/**` y los archivos `.test.tsx` están excluidos
- Umbral mínimo: **80 %** ( lines / functions / statements / branches )

---

## 🏗️ Build de producción

```bash
bun run build      # tsc -b && vite build ( checks de TypeScript + bundling )
bun run preview    # previsualizá el build localmente
```

---

## 🗂️ Estructura del proyecto

```
.
├── supabase/
│   ├── config.toml             # config del Supabase CLI
│   └── migrations/             # migraciones versionadas
│       └── 00001_init.sql      # tablas + PostGIS + RLS + Storage + Realtime
src/
├── main.tsx                    # bootstrap + React QueryClientProvider + BrowserRouter
├── App.tsx                     # rutas ( react-router-dom ) + Navbar + sesión
├── index.css                   # Tailwind + variables de tema ( shadcn/ui )
├── lib/
│   ├── supabase.ts             # cliente supabase-js + singleton
│   ├── geo.ts                  # geocodificación Nominatim + url Google Maps
│   ├── storage.ts              # compresión client-side + upload a Storage
│   ├── constants.ts            # necesidades predefinidas, foto placeholder
│   └── utils.ts                # cn(), formatDate(), formatDistance(), truncate()
├── hooks/
│   └── useGeolocation.ts
├── types/
│   └── db.ts                   # interfaces CentroAcopio, Post, AuthUser…
├── features/                  # lógica por feature ( queries / mutations / realtime )
│   ├── auth/session.ts
│   ├── centros/{queries,mutations}.ts
│   └── posts/{queries,mutations,realtime}.ts
├── components/
│   ├── ui/                     # Button, Card, Input, Textarea, Label
│   ├── layout/                  # Navbar, ProtectedRoute
│   ├── centro/                  # CentroCard, CentroGrid, CentroForm
│   ├── post/                    # PostCard, PostFeed, PostForm
│   └── common/                  # FotoUploader, NecesidadesSelector
├── pages/                      # HomePage, CentroPerfilPage, Login, Registro, Nuevo/Editar centro
└── test/
    ├── setup.ts                # arranca MSW + resets por test
    ├── test-utils.tsx          # renderWithProviders / createTestQueryClient
    └── mocks/                  # handlers MSW, fixtures, server
```

---

## ✨ Funcionalidades

### Páginas

| Ruta                  | Descripción                                                                                     |
|-----------------------|-------------------------------------------------------------------------------------------------|
| `/`                   | Solicita geolocalización, llama al RPC `centros_cercanos`, grilla de cards. Fallback: orden por ciudad. |
| `/centro/:id`         | Datos del centro + botón "Cómo llegar" ( Google Maps ) + feed de posts + **Realtime** + PostForm ( solo coordinador ) |
| `/login`              | Login con email/password ( Supabase Auth )                                                         |
| `/registro`           | Signup con email/password                                                                          |
| `/centros/nuevo`      | ( protegida ) Form de alta de centro con geocodificación automática.                              |
| `/centro/:id/editar`  | ( protegida ) Edición de centro ( solo el coordinador dueño )                                      |

### Componentes clave

- **CentroCard** — card cuadrada responsive ( foto o placeholder, nombre, ciudad, distancia, preview del último post )
- **CentroGrid** — grilla responsive 2 col mobile / 3-4 desktop
- **CentroForm** — alta/edición con geocoding Nominatim, toggle de coordenadas manuales, upload de foto
- **PostCard / PostFeed** — feed estilo Instagram + chips de `necesidades[]`
- **PostForm** — contenido + foto opcional + multi-select de necesidades ( predefinidas + texto libre )
- **FotoUploader** — compresión client-side ( `canvas.toBlob('image/jpeg', 0.8)`, max ~1MB ) + upload a Storage
- **NecesidadesSelector** — chips toggleables + input para necesidades custom
- **Navbar / ProtectedRoute** — barra superior + guard de rutas autenticadas

### Features

- `useCentrosCercanos` / `useCentro` / `usePostsCentro`
- `useCrearCentro` / `useEditarCentro` / `useCrearPost`
- `useRealtimePosts( centroId )` — suscripción a `postgres_changes` con cleanup en `useEffect`
- `useSession` / `signIn` / `signUp`
- `useGeolocation`

---

## 🧭 Decisiones de diseño ( ver docs/ARCHITECTURE.md )

- **Público por defecto:** home y perfiles funcionan sin login. Solo registro / edición / posteo requiere auth.
- **Mobile first:** todo funciona en 360px de ancho.
- **Sin overengineering:** no hay estado global, no hay libs extrañas fuera del stack.
- **staleTime: 30s** en home, **gcTime: 5min** ( ver `src/main.tsx` ).
- **Nominatim:** throttle de 1 req/segundo por IP ( ver `src/lib/geo.ts` ).
- **Realtime:** se suscribe **solo al canal del centro abierto** y siempre limpia la suscripción al desmontar.
- **coordinador_id** se setea desde `auth.uid()` ( forzado por RLS ), nunca de un campo de formulario.
- **Botón "Cómo llegar":** `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`.

---

## 🆘 Troubleshooting

- **`Faltan variables de entorno`** al correr `bun run dev`: te falta crear/completar `.env` ( ver paso 3 ).
- **No aparecen centros en la home:** ejecutaste `supabase/schema.sql` en tu proyecto Supabase? La tabla debe existir y tener filas.
- **No llegan posts en tiempo real:** verificá que el script habilitó Realtime para `posts` ( sección 10 del SQL ) y que hay Realtime habilitado en tu proyecto Supabase ( Dashboard → Database → Replication ).
- **Error al subir fotos:** el bucket `centros-fotos` debe existir y ser público ( Storage → New bucket ).

---

## 📦 Comandos disponibles

| Comando                | Descripción                                          |
|------------------------|------------------------------------------------------|
| `bun run dev`          | Servidor de desarrollo ( Vite, HMR )                 |
| `bun run build`        | Build de producción ( `tsc -b && vite build` )        |
| `bun run preview`      | Previsualizá el build localmente                      |
| `bun run test`         | Corre todos los tests una vez                         |
| `bun run test:watch`   | Tests en modo watch                                   |
| `bun run test:coverage`| Tests con reporte de cobertura                         |
| `bun run lint`         | Linter ( oxlint )                                     |
| `bun run supabase:link`  | `supabase link --project-ref $SUPABASE_PROJECT_REF` |
| `bun run supabase:push`  | Aplica migraciones pendientes al proyecto remoto      |
| `bun run supabase:diff`  | `supabase db diff -f` ( generá nueva migración )       |
| `bun run supabase:new`   | `supabase migration new` ( archivo en blanco )         |
| `bun run supabase:types` | Regenera tipos TS desde el schema remoto               |

---

## 🔒 Seguridad

- **RLS** es la única fuente de verdad de permisos: cualquier cliente ( web, móvil )
  está sujeto a las mismas reglas. Sin middleware de authorization en el frontend.
- `coordinador_id` siempre se toma de `auth.uid()` vía RLS, nunca del cliente.
- Las políticas de Storage usan `auth.uid()` como prefijo de carpeta para aislar las fotos por usuario.

---

## 🟧 Licencia

Proyecto de ayuda humanitaria, código abierto para uso en emergencias.
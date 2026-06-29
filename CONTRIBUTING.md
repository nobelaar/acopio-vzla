# Contribuir a Acopio

Gracias por querer ayudar. Acopio es una plataforma de ayuda humanitaria open-source
construida con React 18, Supabase, TanStack Query y Tailwind CSS.

## Setup rapido

```bash
bun install
cp .env.example .env   # completa con tus credenciales de Supabase
bun run dev             # http://localhost:5173
```

## Comandos

| Comando | Que hace |
|---------|----------|
| `bun run dev` | Servidor de desarrollo (Vite HMR) |
| `bun run build` | Typecheck + build de produccion |
| `bun run test` | Corre todos los tests |
| `bun run test:watch` | Tests en modo watch |
| `bun run lint` | Linter (oxlint) |
| `bun run supabase:push` | Aplica migraciones al remoto |

## Antes de abrir un PR

1. **Lint**: `bun run lint`
2. **Typecheck**: `tsc -b`
3. **Tests**: `bun run test`
4. **Build**: `bun run build`

El CI en GitHub Actions corre todo esto automaticamente y bloquea el merge si algo falla.

## Convenciones

- **Idioma**: todo el codigo (funciones, variables, componentes, UI) va en espanol
- **Package manager**: solo Bun (`bun install`, `bun run`, `bun add`). Nada de npm/yarn/pnpm.
- **Autenticacion**: `coordinador_id` siempre viene de `auth.uid()` via RLS, nunca del frontend
- **Estilo**: shadcn/ui + Tailwind. Componentes con `React.forwardRef` y `cn()` de `@/lib/utils`
- **Tests**: Vitest + MSW. Usar `renderWithProviders` de `@/test/test-utils`
- **Mobile-first**: minimo 360px de ancho

## Flujo de PR

1. Hace un fork del repo
2. Crea una branch con nombre descriptivo (`fix/...`, `feat/...`, `refactor/...`)
3. Hace tus cambios con tests
4. Asegurate de que `bun run lint`, `tsc -b`, y `bun run test` pasen
5. Abri un PR contra `main`
6. El CI va a correr automaticamente. Si algo falla, revisa los logs.
7. Un maintainer revisara tu PR

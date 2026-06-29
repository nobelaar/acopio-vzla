## Descripcion

<!-- Explica que hace este cambio y por que -->

## Checklist

- [ ] `bun run lint` pasa
- [ ] `tsc -b` pasa
- [ ] `bun run test` pasa
- [ ] Agregue tests si toque features (`src/features/`) o componentes (`src/components/`)
- [ ] Probe en mobile (360px) si cambie la UI
- [ ] No hardcodee `coordinador_id` (siempre va por RLS desde `auth.uid()`)

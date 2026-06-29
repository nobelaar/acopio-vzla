import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AnuncioCard } from './AnuncioCard'
import { createTestQueryClient } from '@/test/test-utils'
import type { AnuncioWithUtil } from '@/types/db'

const transporteAnuncio: AnuncioWithUtil = {
  id: 'test-1',
  tipo: 'transporte',
  titulo: 'Camioneta a Valencia',
  descripcion: 'Llevo personas e insumos',
  ciudad: 'Caracas',
  zona: 'El Hatillo',
  contacto: '0412-9999999',
  centro_id: null,
  user_id: null,
  capacidad: 4,
  duracion: '2 horas',
  mascotas: false,
  accesibilidad: false,
  activo: true,
  created_at: '2025-01-14T08:00:00.000Z',
  destino: 'Valencia',
  tipo_carga: 'ambos',
  tipo_vehiculo: 'camioneta',
  util_count: 0,
  user_has_util: false,
}

function renderCard(anuncio: AnuncioWithUtil) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <AnuncioCard anuncio={anuncio} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AnuncioCard (transporte)', () => {
  it('shows transporte badge', () => {
    renderCard(transporteAnuncio)
    expect(screen.getByText(/transporte/i)).toBeInTheDocument()
  })

  it('shows destination arrow', () => {
    renderCard(transporteAnuncio)
    expect(screen.getByText(/→ Valencia/i)).toBeInTheDocument()
  })

  it('shows tipo de carga', () => {
    renderCard(transporteAnuncio)
    expect(screen.getByText(/Ambos/i)).toBeInTheDocument()
  })

  it('shows tipo de vehiculo badge', () => {
    renderCard(transporteAnuncio)
    const badges = screen.getAllByText(/Camioneta/i)
    expect(badges.length).toBeGreaterThanOrEqual(2)
  })

  it('shows capacidad value in details', () => {
    renderCard(transporteAnuncio)
    expect(screen.getByText(/4 personas/i)).toBeInTheDocument()
  })
})

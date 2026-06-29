import type { AnuncioTipo } from '@/types/db'

export const NECESIDADES_PREDEFINIDAS = [
  'Agua',
  'Ropa',
  'Medicamentos',
  'Pañales',
  'Alimentos no perecederos',
  'Higiene personal',
  'Combustible',
  'Herramientas',
  'Voluntarios',
  'Otros',
] as const

type Necesidad = (typeof NECESIDADES_PREDEFINIDAS)[number]

export const NECESIDAD_META: Record<Necesidad, { emoji: string; color: string }> = {
  Agua:    { emoji: '💧', color: '#3B82F6' },
  Ropa:    { emoji: '👕', color: '#8B5CF6' },
  Medicamentos: { emoji: '💊', color: '#EF4444' },
  Pañales: { emoji: '👶', color: '#F59E0B' },
  'Alimentos no perecederos': { emoji: '🥫', color: '#10B981' },
  'Higiene personal': { emoji: '🧼', color: '#06B6D4' },
  Combustible: { emoji: '⛽', color: '#F97316' },
  Herramientas: { emoji: '🔧', color: '#6B7280' },
  Voluntarios: { emoji: '🤝', color: '#EC4899' },
  Otros:    { emoji: '📦', color: '#78716C' },
}

export const DEFAULT_FALLBACK_PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#f5f5f4"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#a8a29e" text-anchor="middle" dominant-baseline="middle">Saman</text></svg>'
  )

export const ANUNCIO_TIPO_META: Record<AnuncioTipo, { emoji: string; label: string; color: string }> = {
  hospedaje: { emoji: '🏠', label: 'Hospedaje', color: '#10B981' },
  transporte: { emoji: '🚚', label: 'Transporte', color: '#F59E0B' },
} as const

export const TIPO_CARGA_OPCIONES = ['personas', 'insumos', 'ambos'] as const

export const TIPO_VEHICULO_OPCIONES = ['carro', 'camioneta', 'camion', 'moto'] as const

export const DURACION_OPCIONES = [
  '1 semana',
  '2 semanas',
  '1 mes',
  '3 meses',
  'Indefinido',
] as const

export const CAPACIDAD_OPCIONES = [1, 2, 3, 4, 5, 6, '7+'] as const
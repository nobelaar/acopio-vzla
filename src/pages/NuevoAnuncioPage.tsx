import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCrearAnuncio } from '@/features/anuncios/mutations'
import { useCentros } from '@/features/centros/queries'
import { Button } from '@/components/ui/button'
import { DURACION_OPCIONES, CAPACIDAD_OPCIONES, TIPO_CARGA_OPCIONES, TIPO_VEHICULO_OPCIONES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import type { AuthUser, AnuncioTipo } from '@/types/db'

interface Props {
  user: AuthUser | null
}

export function NuevoAnuncioPage({ user }: Props) {
  const navigate = useNavigate()
  const crearAnuncio = useCrearAnuncio()
  const { data: centros = [] } = useCentros()

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [zona, setZona] = useState('')
  const [contacto, setContacto] = useState('')
  const [capacidad, setCapacidad] = useState<number | string>('')
  const [duracion, setDuracion] = useState('')
  const [mascotas, setMascotas] = useState(false)
  const [accesibilidad, setAccesibilidad] = useState(false)
  const [destino, setDestino] = useState('')
  const [tipoCarga, setTipoCarga] = useState<string>('')
  const [tipoVehiculo, setTipoVehiculo] = useState<string>('')
  const [tipo, setTipo] = useState<AnuncioTipo>('hospedaje')
  const [centroId, setCentroId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const misCentros = centros.filter(
    (c) => c.coordinador_id === user?.id
  )

  function validate(): string | null {
    if (!titulo.trim()) return 'Completa el titulo'
    if (!descripcion.trim()) return 'Completa la descripcion'
    if (!ciudad.trim()) return 'Completa la ciudad'
    if (!contacto.trim()) return 'Completa el contacto'
    if (descripcion.length > 2000) return 'La descripcion es demasiado larga'
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    crearAnuncio.mutate(
      {
        tipo,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        ciudad: ciudad.trim(),
        zona: zona.trim() || null,
        contacto: contacto.trim(),
        centro_id: centroId,
        user_id: centroId ? null : user?.id,
        capacidad: capacidad
          ? typeof capacidad === 'string'
            ? null
            : capacidad
          : null,
        duracion: duracion || null,
        mascotas,
        accesibilidad,
        destino: destino.trim() || null,
        tipo_carga: (tipoCarga || null) as 'personas' | 'insumos' | 'ambos' | null,
        tipo_vehiculo: (tipoVehiculo || null) as 'carro' | 'camioneta' | 'camion' | 'moto' | null,
      },
      { onSuccess: () => navigate('/') }
    )
  }

  if (!user) {
    navigate('/login?redirect=/anuncio/nuevo')
    return null
  }

  return (
    <div className="pb-14">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-4 py-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-[17px] font-bold">Nuevo anuncio</span>
      </div>

      <div className="flex border-b border-border">
        {(['hospedaje', 'transporte'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={cn(
              'flex-1 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors',
              tipo === t && 'text-foreground border-b-2 border-primary font-bold'
            )}
          >
            {t === 'hospedaje' ? '🏠 Hospedaje' : '🚚 Transporte'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
            {error}
          </p>
        )}

        {misCentros.length > 0 && (
          <div className="space-y-1">
            <label className="text-[13px] font-medium text-muted-foreground">
              Publicar como
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCentroId(null)}
                className={`rounded-full px-3 py-1.5 text-[13px] ${
                  centroId === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                Personal
              </button>
              {misCentros.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCentroId(c.id)}
                  className={`rounded-full px-3 py-1.5 text-[13px] ${
                    centroId === c.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[13px] font-medium">Titulo *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="ej: Habitacion disponible en El Hatillo"
            maxLength={200}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[13px] font-medium">Descripcion *</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe el espacio, servicios, condiciones..."
            rows={4}
            maxLength={2000}
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-right text-[11px] text-muted-foreground">
            {descripcion.length}/2000
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[13px] font-medium">Ciudad *</label>
            <input
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="ej: Caracas"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-medium">Zona / Barrio</label>
            <input
              type="text"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              placeholder="ej: El Hatillo"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[13px] font-medium">Contacto *</label>
          <input
            type="text"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            placeholder="Telefono o WhatsApp"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="border-t border-border pt-3">
          {tipo === 'hospedaje' && (
            <p className="mb-3 text-[13px] font-semibold text-muted-foreground">
              Detalles del hospedaje
            </p>
          )}
          {tipo === 'transporte' && (
            <p className="mb-3 text-[13px] font-semibold text-muted-foreground">
              Detalles del transporte
            </p>
          )}

          {tipo === 'transporte' && (
            <div className="space-y-3 mb-3">
              <div className="space-y-1">
                <label className="text-[13px] font-medium">Destino</label>
                <input
                  type="text"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="ej: Valencia"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-medium">Tipo de carga</label>
                <select
                  value={tipoCarga}
                  onChange={(e) => setTipoCarga(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Seleccionar</option>
                  {TIPO_CARGA_OPCIONES.map((tc) => (
                    <option key={tc} value={tc}>
                      {tc === 'personas' ? 'Personas' : tc === 'insumos' ? 'Insumos' : 'Ambos'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-medium">Tipo de vehiculo</label>
                <select
                  value={tipoVehiculo}
                  onChange={(e) => setTipoVehiculo(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Seleccionar</option>
                  {TIPO_VEHICULO_OPCIONES.map((tv) => (
                    <option key={tv} value={tv}>
                      {tv.charAt(0).toUpperCase() + tv.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[13px] font-medium">Capacidad</label>
              <select
                value={capacidad}
                onChange={(e) => {
                  const val = e.target.value
                  setCapacidad(val === '7+' ? val : val ? Number(val) : '')
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Seleccionar</option>
                {CAPACIDAD_OPCIONES.map((c) => (
                  <option key={c} value={c}>
                    {c === '7+' ? '7 o mas' : c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-medium">Duracion</label>
              <select
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Seleccionar</option>
                {DURACION_OPCIONES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {tipo === 'hospedaje' && (
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={mascotas}
                  onChange={(e) => setMascotas(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-[14px]">Acepta mascotas</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={accesibilidad}
                  onChange={(e) => setAccesibilidad(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-[14px]">Accesible (silla de ruedas)</span>
              </label>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={crearAnuncio.isPending}
          className="w-full rounded-full py-3 text-[15px] font-semibold"
        >
          {crearAnuncio.isPending ? 'Publicando...' : 'Publicar anuncio'}
        </Button>
      </form>
    </div>
  )
}

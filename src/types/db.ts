export interface CentroAcopio {
  id: string
  coordinador_id: string
  nombre: string
  descripcion: string | null
  direccion: string
  ciudad: string
  contacto: string | null
  foto_portada: string | null
  created_at: string
}

export interface Post {
  id: string
  centro_id: string | null
  user_id?: string | null
  contenido: string
  foto_url: string | null
  necesidades: string[]
  created_at: string
}

export interface CentroResumen {
  id: string
  coordinador_id: string
  nombre: string
  descripcion: string | null
  ciudad: string
  direccion: string
  foto_portada: string | null
  contacto: string | null
  ultimo_post_contenido: string | null
  ultimo_post_created_at: string | null
}

export interface CentroConPosts extends CentroAcopio {
  posts: Pick<Post, 'contenido' | 'created_at'>[]
}

export interface AuthUser {
  id: string
  email: string
}

export interface AuthSession {
  user: AuthUser
  access_token: string
}

export interface PostUtil {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Notificacion {
  id: string
  user_id: string
  post_id: string
  centro_id: string | null
  tipo: 'comentario'
  leida: boolean
  created_at: string
}

export interface ComentarioUtil {
  id: string
  comentario_id: string
  user_id: string
  created_at: string
}

export interface ComentarioWithUtil extends PostComentario {
  util_count: number
  user_has_util: boolean
}

export interface PostComentario {
  id: string
  post_id: string
  user_id: string
  contenido: string
  autor_email: string | null
  created_at: string
}

export interface PostWithUtil extends Post {
  util_count: number
  user_has_util: boolean
}

export type AnuncioTipo = 'hospedaje' | 'transporte'

export interface Anuncio {
  id: string
  tipo: AnuncioTipo
  titulo: string
  descripcion: string
  ciudad: string
  zona: string | null
  contacto: string
  centro_id: string | null
  user_id: string | null
  capacidad: number | null
  duracion: string | null
  mascotas: boolean
  accesibilidad: boolean
  activo: boolean
  created_at: string
  destino: string | null
  tipo_carga: 'personas' | 'insumos' | 'ambos' | null
  tipo_vehiculo: 'carro' | 'camioneta' | 'camion' | 'moto' | null
}

export interface AnuncioWithUtil extends Anuncio {
  util_count: number
  user_has_util: boolean
}

export interface AnuncioUtil {
  id: string
  anuncio_id: string
  user_id: string
  created_at: string
}

export type FeedItem =
  | { kind: 'post'; data: PostWithUtil; centroNombre?: string; centroCiudad?: string }
  | { kind: 'anuncio'; data: AnuncioWithUtil; centroNombre?: string; centroCiudad?: string }

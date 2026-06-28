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
  centro_id: string
  contenido: string
  foto_url: string | null
  necesidades: string[]
  created_at: string
}

export interface CentroResumen {
  id: string
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
  created_at: string
}

export interface PostWithUtil extends Post {
  util_count: number
  user_has_util: boolean
}

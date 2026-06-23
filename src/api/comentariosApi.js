import { ENDPOINTS } from './endpoints.js'
import { fetchConAuth } from './header/fetchConAuth.js'

async function leerMensajeError(response) {
  const text = await response.text().catch(() => '')
  if (!text) return response.statusText || null
  try {
    const data = JSON.parse(text)
    const msg =
      data?.message ??
      data?.mensaje ??
      data?.detail ??
      (typeof data?.error === 'string' && data.error !== 'Forbidden'
        ? data.error
        : null)
    return msg || text
  } catch {
    return text
  }
}

function clasificarError403(mensaje) {
  const m = (mensaje ?? '').toLowerCase()
  if (m.includes('pedido')) return 'SIN_PEDIDO'
  if (m.includes('cliente')) return 'SIN_SESION'
  return null
}

/**
 * @param {number|string} idRestaurante
 * @returns {Promise<boolean>}
 */
export async function clienteYaComentoEnRestaurante(idRestaurante) {
  const params = new URLSearchParams({
    idRestaurante: String(idRestaurante),
  })
  const response = await fetchConAuth(
    `${ENDPOINTS.COMENTARIOS_YA_COMENTE}?${params}`,
    { redirectOnUnauthorized: false },
  )

  if (!response.ok) return false

  const data = await response.json()
  return Boolean(data?.yaComento)
}

/**
 * Comentarios del restaurante autenticado (sin pasar id).
 * @returns {Promise<import('../data/DTOComentario.ts').DTOComentario[]>}
 */
export async function listarMisComentariosRestaurante() {
  const response = await fetchConAuth(ENDPOINTS.COMENTARIOS_LISTAR, {
    redirectOnUnauthorized: false,
  })

  if (response.status === 401 || response.status === 403) {
    throw new Error('SIN_SESION')
  }
  if (!response.ok) {
    const msg = await leerMensajeError(response)
    throw new Error(msg || 'No se pudieron cargar las reseñas')
  }

  const data = await response.json()
  return Array.isArray(data) ? data : []
}

/**
 * @param {number|string} idRestaurante
 * @returns {Promise<import('../data/DTOComentario.ts').DTOComentario[]>}
 */
export async function listarComentariosRestaurante(idRestaurante) {
  const params = new URLSearchParams({
    idRestaurante: String(idRestaurante),
  })
  const response = await fetchConAuth(
    `${ENDPOINTS.COMENTARIOS_LISTAR}?${params}`,
    { redirectOnUnauthorized: false },
  )

  if (response.status === 401 || response.status === 403) {
    throw new Error('SIN_SESION')
  }
  if (!response.ok) {
    const msg = await leerMensajeError(response)
    throw new Error(msg || 'No se pudieron cargar las reseñas')
  }

  const data = await response.json()
  return Array.isArray(data) ? data : []
}

/**
 * @param {number|string} idRestaurante
 * @returns {Promise<number>}
 */
export async function obtenerCalificacionRestaurante(idRestaurante) {
  const path = ENDPOINTS.CALIFICACION_OBTENER.replace(':id', String(idRestaurante))
  const response = await fetchConAuth(path, { redirectOnUnauthorized: false })

  if (response.status === 401 || response.status === 403) {
    throw new Error('SIN_SESION')
  }
  if (!response.ok) {
    const msg = await leerMensajeError(response)
    throw new Error(msg || 'No se pudo obtener la calificación')
  }

  const valor = await response.json()
  return typeof valor === 'number' ? valor : Number(valor) || 0
}

/**
 * @param {{ idRestaurante: number|string, calificacion: number, texto: string }} payload
 * @returns {Promise<import('../data/DTOComentario.ts').DTOComentario>}
 */
export async function agregarComentarioRestaurante(payload) {
  const response = await fetchConAuth(ENDPOINTS.COMENTARIOS_AGREGAR, {
    method: 'POST',
    body: JSON.stringify({
      idRestaurante: Number(payload.idRestaurante),
      calificacion: payload.calificacion,
      texto: payload.texto,
    }),
    redirectOnUnauthorized: false,
  })

  if (response.status === 403) {
    const msg = await leerMensajeError(response)
    const codigo = clasificarError403(msg)
    if (codigo) throw new Error(codigo)
    throw new Error(
      msg && msg !== 'Forbidden'
        ? msg
        : 'No tenés permiso para comentar en este restaurante',
    )
  }
  if (response.status === 401) {
    throw new Error('SIN_SESION')
  }
  if (response.status === 409) {
    throw new Error('YA_COMENTO')
  }
  if (!response.ok) {
    const msg = await leerMensajeError(response)
    throw new Error(msg || 'No se pudo publicar el comentario')
  }

  return response.json()
}

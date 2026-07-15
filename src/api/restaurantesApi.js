import { ENDPOINTS } from './endpoints'
import { fetchConAuth } from './header/fetchConAuth.js'
import { mapearRestaurante } from './mapeadores'

const CACHE_ZONA_KEY = 'trego_cache_zona_v1'
/** Cache corta: el listado por zona es lento (Geoapify por local en el back). */
const CACHE_ZONA_TTL_MS = 3 * 60 * 1000

function claveZona(latitud, longitud) {
  // ~100 m de precisión: evita miss por ruido del GPS
  return `${Number(latitud).toFixed(3)},${Number(longitud).toFixed(3)}`
}

function leerCacheZona(latitud, longitud) {
  try {
    const raw = sessionStorage.getItem(CACHE_ZONA_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw)
    if (cached?.clave !== claveZona(latitud, longitud)) return null
    if (Date.now() - (cached.ts ?? 0) > CACHE_ZONA_TTL_MS) return null
    return Array.isArray(cached.lista) ? cached.lista : null
  } catch {
    return null
  }
}

function guardarCacheZona(latitud, longitud, lista) {
  try {
    sessionStorage.setItem(
      CACHE_ZONA_KEY,
      JSON.stringify({
        clave: claveZona(latitud, longitud),
        ts: Date.now(),
        lista,
      }),
    )
  } catch {
    // ignore
  }
}

async function listarDesdeBackend(nombre) {
  const params = nombre?.trim() ? `?nombre=${encodeURIComponent(nombre.trim())}` : ''
  const response = await fetchConAuth(`${ENDPOINTS.RESTAURANTES}${params}`)
  if (!response.ok) throw new Error('Error al listar restaurantes')
  const data = await response.json()
  const lista = Array.isArray(data) ? data : data.restaurantes ?? []
  return lista.map(mapearRestaurante).filter(Boolean)
}

async function listarZonaDesdeBackend(latitud, longitud) {
  const response = await fetchConAuth(ENDPOINTS.RESTAURANTES_ZONA, {
    method: 'POST',
    body: JSON.stringify({ latitud, longitud }),
  })
  if (response.status === 404) throw new Error('NO_EN_ZONA')
  if (response.status === 401 || response.status === 403) throw new Error('SIN_SESION')
  if (!response.ok) throw new Error('Error al listar por zona')
  const data = await response.json()
  const lista = Array.isArray(data) ? data : []
  return lista.map(mapearRestaurante).filter(Boolean)
}

/**
 * @param {{ latitud: number, longitud: number }} params
 * @param {{ force?: boolean }} [opciones] force=true ignora cache
 */
export async function obtenerRestaurantesZona(params, opciones = {}) {
  const { latitud, longitud } = params
  if (!opciones.force) {
    const cached = leerCacheZona(latitud, longitud)
    if (cached) return cached
  }
  const lista = await listarZonaDesdeBackend(latitud, longitud)
  guardarCacheZona(latitud, longitud, lista)
  return lista
}

export async function buscarRestaurantes(params) {
  return listarDesdeBackend(params.nombre)
}

/** Todos los restaurantes habilitados (para resolver nombres en historial, etc.). */
export async function listarRestaurantesTodos() {
  const response = await fetchConAuth(ENDPOINTS.RESTAURANTES_TODOS)
  if (!response.ok) throw new Error('Error al listar restaurantes')
  const data = await response.json()
  const lista = Array.isArray(data) ? data : []
  return lista.map(mapearRestaurante).filter(Boolean)
}
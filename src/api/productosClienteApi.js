import { ENDPOINTS } from './endpoints.js'
import { fetchConAuth } from './header/fetchConAuth.js'
import { mapearProducto } from './mapeadores.js'
import { obtenerMenuRestaurante } from './menuApi.js'
import { esProductoOfertaVigente, sanitizarOfertasCliente } from '../utils/productos.js'

function esOfertaPlatoVisible(item) {
  return !!item?.producto && esProductoOfertaVigente(item.producto)
}

function filtrarOfertasVisibles(lista) {
  return (lista ?? []).filter(esOfertaPlatoVisible)
}

function idsRestaurantesEnZona(restaurantesZona) {
  return new Set(
    (restaurantesZona ?? [])
      .map((r) => r.idUsuario ?? r.idRestaurante)
      .filter((id) => id != null),
  )
}

export function enriquecerOfertaZona(item, restaurantesZona) {
  const id = item.idRestaurante ?? item.producto?.idRestaurante
  const resto = (restaurantesZona ?? []).find(
    (r) => (r.idUsuario ?? r.idRestaurante) === id,
  )
  return {
    ...item,
    idRestaurante: id,
    nombreRestaurante: item.nombreRestaurante || resto?.nombre || '',
    calificacionProm: item.calificacionProm ?? resto?.calificacionProm ?? 0,
    direccion: item.direccion ?? resto?.direccion,
  }
}

function mapearProductoZona(dto, restaurantesZona = [], { desdeApiOfertas = false } = {}) {
  if (!dto) return null
  const producto = mapearProducto(dto.producto ?? dto)
  if (!producto) return null
  // El endpoint de ofertas solo devuelve productos con ofertaActiva=true en DB.
  if (desdeApiOfertas && producto.oferta && producto.ofertaActiva === undefined) {
    producto.ofertaActiva = true
  }
  const idRestaurante =
    producto.idRestaurante ??
    dto.producto?.idRestaurante ??
    dto.idRestaurante
  return enriquecerOfertaZona(
    {
      producto: { ...producto, idRestaurante },
      nombreRestaurante: dto.nombreRestaurante ?? '',
      calificacionProm: dto.calificacionProm ?? 0,
      idRestaurante,
      direccion: dto.direccion,
    },
    restaurantesZona,
  )
}

/**Listar ofertas segun la zona del usuario */
async function listarOfertasDesdeApi(coords, restaurantesZona = []) {
  if (!coords) return []

  const body = JSON.stringify({
    latitud: coords.latitud,
    longitud: coords.longitud,
  })

  // Hacemos el POST directo que espera tu backend de Spring Boot
  const response = await fetchConAuth(ENDPOINTS.LISTAR_PRODUCTOS_OFERTA, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', 
    },
    body,
  })

  if (response.status === 404) return []
  if (!response.ok) return null

  const data = await response.json()
  const lista = Array.isArray(data) ? data : []

  const items = lista
    .map((dto) =>
      mapearProductoZona(dto, restaurantesZona, { desdeApiOfertas: true }),
    )
    .filter(Boolean)

  return filtrarOfertasVisibles(items)
}

/** Productos habilitados de una subcategoría en la zona del cliente. */
export async function listarProductosPorSubcategoriaEnZona(
  coords,
  idSubCategoria,
  restaurantesZona = [],
) {
  if (!coords || idSubCategoria == null) return []

  const url = `${ENDPOINTS.LISTAR_PRODUCTOS_SUBCATEGORIA}?idSubCategoria=${idSubCategoria}`
  const response = await fetchConAuth(url, {
    method: 'POST',
    body: JSON.stringify({
      latitud: coords.latitud,
      longitud: coords.longitud,
    }),
  })

  if (response.status === 404) return []
  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || 'Error al listar platos de la subcategoría')
  }

  const data = await response.json()
  const lista = Array.isArray(data) ? data : []

  return lista
    .map((dto) => mapearProductoZona(dto, restaurantesZona))
    .filter(Boolean)
}

/** Productos con oferta activa en la zona del cliente. */
export async function listarProductosOfertaEnZona(coords, restaurantesZona = []) {
  if (!coords) return []

  try {
    const desdeApi = await listarOfertasDesdeApi(coords, restaurantesZona)
    if (desdeApi !== null) {
      return desdeApi
    }
  } catch {
    // sin fallback por menú: el menú no trae ofertaActiva y muestra inactivas
  }

  return []
}

/**
 * Busca en la zona por nombre de restaurante o por platos en el menú.
 * No hay endpoint dedicado en el back: se consulta el menú de cada local en paralelo.
 */
export async function buscarPlatosEnZona(restaurantesZona, termino) {
  const terminoNorm = termino.toLowerCase().trim()
  if (!terminoNorm || !restaurantesZona?.length) return []

  const resultados = await Promise.allSettled(
    restaurantesZona.map(async (restaurante) => {
      const id = restaurante.idUsuario ?? restaurante.idRestaurante
      if (!id) return null

      const nombreRest = (restaurante.nombre ?? '').toLowerCase()
      const descRest = (restaurante.descripcion ?? '').toLowerCase()
      const catRest = (restaurante.categoria ?? '').toLowerCase()
      const coincidenciaPorNombre =
        nombreRest.includes(terminoNorm) ||
        descRest.includes(terminoNorm) ||
        catRest.includes(terminoNorm)

      let productos = []
      try {
        const menu = await obtenerMenuRestaurante(id)
        productos = sanitizarOfertasCliente(
          (menu.productos ?? [])
            .map((p) => mapearProducto(p))
            .filter(Boolean),
        ).filter((p) => {
            const nombre = (p.nombre ?? '').toLowerCase()
            const desc = (p.descripcion ?? '').toLowerCase()
            return nombre.includes(terminoNorm) || desc.includes(terminoNorm)
          })
      } catch {
        // Si falla el menú pero el nombre del local coincide, igual lo mostramos
      }

      if (productos.length === 0 && !coincidenciaPorNombre) return null

      return {
        restaurante,
        productos,
        coincidenciaPorNombre,
      }
    }),
  )

  return resultados
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value)
}

/** Producto completo + restaurante para abrir el modal desde Mejores ofertas. */
export async function resolverProductoOfertaParaCarrito(
  oferta,
  { restaurantesZona = [] } = {},
) {
  const idRestaurante = oferta.idRestaurante ?? oferta.producto?.idRestaurante
  const idProducto = oferta.producto?.idProducto
  if (!idRestaurante || !idProducto) {
    return { producto: oferta.producto ?? null, restaurante: null }
  }

  const idsActivos = new Set([idProducto])
  const restoEnZona = (restaurantesZona ?? []).find(
    (r) => (r.idUsuario ?? r.idRestaurante) === idRestaurante,
  )
  const restauranteFallback = {
    idRestaurante,
    nombre: oferta.nombreRestaurante ?? restoEnZona?.nombre ?? '',
    abierto: restoEnZona?.abierto ?? true,
    habilitado: restoEnZona?.habilitado ?? true,
  }

  try {
    const menu = await obtenerMenuRestaurante(idRestaurante)
    const delMenu = (menu.productos ?? []).find(
      (p) => p.idProducto === idProducto,
    )
    const producto = delMenu
      ? sanitizarOfertasCliente([delMenu], idsActivos)[0]
      : {
          ...oferta.producto,
          idRestaurante,
          ofertaActiva: true,
        }

    return {
      producto,
      restaurante: menu.restaurante ?? restauranteFallback,
    }
  } catch {
    return {
      producto: {
        ...oferta.producto,
        idRestaurante,
        ofertaActiva: true,
      },
      restaurante: restauranteFallback,
    }
  }
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { obtenerRestaurantesZona } from '../api/restaurantesApi'
import {
  buscarPlatosEnZona,
  listarProductosOfertaEnZona,
  enriquecerOfertaZona,
} from '../api/productosClienteApi.js'
import {
  FILTROS_INICIALES,
  filtrarOfertasPlatos,
  filtrarRestaurantes,
  filtrarResultadosPlato,
  hayFiltrosActivos,
  ordenarOfertasPlatos,
  ordenarRestaurantes,
  ordenarResultadosPlato,
} from '../utils/filtrosRestaurantes.js'

export function useRestaurantes() {
  const [restaurantesZona, setRestaurantesZona] = useState([])
  const [resultadosPlato, setResultadosPlato] = useState([])
  const [ofertasZona, setOfertasZona] = useState([])
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [modoBusqueda, setModoBusqueda] = useState(false)
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)
  const [cargandoOfertas, setCargandoOfertas] = useState(false)
  const [error, setError] = useState(null)

  const restaurantesZonaRef = useRef(restaurantesZona)
  const ofertasZonaRef = useRef(ofertasZona)

  const activeRequestIdRef = useRef(0)

  // CACHE PARA EVITAR DOBLE FETCH POR DEBOUNCE AL LIMPIAR
  const ultimoFetchRef = useRef({ latitud: undefined, longitud: undefined, termino: undefined })

  useEffect(() => {
    restaurantesZonaRef.current = restaurantesZona
  }, [restaurantesZona])

  useEffect(() => {
    ofertasZonaRef.current = ofertasZona
  }, [ofertasZona])

  const mensajeErrorAmigable = (e) => {
    const msg = e?.message ?? ''
    if (msg === 'NO_EN_ZONA') {
      return 'No hay restaurantes que repartan hasta tu ubicación. Probá desde Montevideo o ampliá el radio en los locales de prueba.'
    }
    if (msg === 'SIN_SESION') {
      return 'Tenés que iniciar sesión como cliente para ver restaurantes en tu zona.'
    }
    if (msg.includes('listar por zona') || msg.includes('500')) {
      return 'No se pudieron cargar restaurantes para tu zona. Reiniciá el backend y revisá geoapify.api.key en application.properties.'
    }
    return msg || 'Error al cargar restaurantes'
  }

  // CARGA DE ZONA CON PREVENCIÓN DE DUPLICADOS
  const cargarZona = useCallback(async (coords, forzar = false) => {
    if (!coords) return

    // Redondeo preventivo a 4 decimales (~11 metros de margen de drift de GPS)
    const lat = Math.round(coords.latitud * 10000) / 10000;
    const lng = Math.round(coords.longitud * 10000) / 10000;

    // Si ya tenemos datos del mismo lugar sin busquedas activas, evitamos el viaje al server
    if (
      !forzar &&
      restaurantesZonaRef.current.length > 0 &&
      ultimoFetchRef.current.latitud === lat &&
      ultimoFetchRef.current.longitud === lng &&
      ultimoFetchRef.current.termino === ''
    ) {
      setModoBusqueda(false)
      setTerminoBusqueda('')
      setResultadosPlato([])
      return
    }

    setCargando(true)
    setCargandoOfertas(true)
    setError(null)
    setModoBusqueda(false)
    setTerminoBusqueda('')
    setResultadosPlato([])

    const requestId = ++activeRequestIdRef.current
    ultimoFetchRef.current = { latitud: lat, longitud: lng, termino: '' }

    try {
      const [restaurantesData, ofertasData] = await Promise.all([
        obtenerRestaurantesZona({ latitud: lat, longitud: lng }),
        listarProductosOfertaEnZona({ latitud: lat, longitud: lng })
      ])

      if (requestId !== activeRequestIdRef.current) return 

      setRestaurantesZona(restaurantesData)
      setOfertasZona(ofertasData)
    } catch (e) {
      if (requestId !== activeRequestIdRef.current) return
      setError(mensajeErrorAmigable(e))
      setRestaurantesZona([])
      setOfertasZona([])
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setCargando(false)
        setCargandoOfertas(false)
      }
    }
  }, [])

  // BÚSQUEDA DE PLATOS ASÍNCRONA 
  const buscarPlato = useCallback(async (coords, termino, forzar = false) => {
    if (!coords || !termino.trim()) return
    const termLimpio = termino.trim()

    const lat = Math.round(coords.latitud * 10000) / 10000;
    const lng = Math.round(coords.longitud * 10000) / 10000;

    if (
      !forzar &&
      ultimoFetchRef.current.latitud === lat &&
      ultimoFetchRef.current.longitud === lng &&
      ultimoFetchRef.current.termino === termLimpio
    ) {
      setModoBusqueda(true)
      setTerminoBusqueda(termLimpio)
      return
    }

    setCargando(true)
    setError(null)
    setModoBusqueda(true)
    setTerminoBusqueda(termLimpio)

    const requestId = ++activeRequestIdRef.current
    ultimoFetchRef.current = { latitud: lat, longitud: lng, termino: termLimpio }

    try {
      let base = restaurantesZonaRef.current
      if (base.length === 0) {
        base = await obtenerRestaurantesZona({ latitud: lat, longitud: lng })
        if (requestId !== activeRequestIdRef.current) return
        setRestaurantesZona(base)
      }

      const promesas = [buscarPlatosEnZona(base, termLimpio)]
      const necesitaCargarOfertas = ofertasZonaRef.current.length === 0

      if (necesitaCargarOfertas) {
        setCargandoOfertas(true)
        promesas.push(listarProductosOfertaEnZona({ latitud: lat, longitud: lng }))
      }

      const [resultados, ofertasNuevas] = await Promise.all(promesas)
      
      if (requestId !== activeRequestIdRef.current) return
      
      setResultadosPlato(resultados)
      if (necesitaCargarOfertas && ofertasNuevas) {
        setOfertasZona(ofertasNuevas)
      }
    } catch (e) {
      if (requestId !== activeRequestIdRef.current) return
      setError(e.message ?? 'Error en la búsqueda de platos')
      setResultadosPlato([])
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setCargando(false)
        setCargandoOfertas(false)
      }
    }
  }, [])

  const aplicarFiltros = useCallback((nuevosFiltros) => {
    setFiltros(nuevosFiltros)
  }, [])

  const limpiarFiltros = useCallback(async (coords) => {
    setFiltros({ ...FILTROS_INICIALES })
    setModoBusqueda(false)
    setTerminoBusqueda('')
    setResultadosPlato([])
    if (coords) {
      await cargarZona(coords)
    }
  }, [cargarZona])

  const recargar = useCallback((coords) => {
    if (modoBusqueda && terminoBusqueda) {
      return buscarPlato(coords, terminoBusqueda, true)
    }
    return cargarZona(coords, true)
  }, [modoBusqueda, terminoBusqueda, buscarPlato, cargarZona])

  const restaurantes = useMemo(() => {
    const filtrados = filtrarRestaurantes(restaurantesZona, filtros)
    return ordenarRestaurantes(filtrados, filtros.ordenamiento)
  }, [restaurantesZona, filtros])

  const resultadosBusquedaPlato = useMemo(() => {
    const filtrados = filtrarResultadosPlato(resultadosPlato, filtros)
    return ordenarResultadosPlato(filtrados, filtros.ordenamiento)
  }, [resultadosPlato, filtros])

  const ofertasEnriquecidas = useMemo(() => {
    return ofertasZona.map((o) => enriquecerOfertaZona(o, restaurantesZona))
  }, [ofertasZona, restaurantesZona])

  const mejoresOfertas = useMemo(() => {
    const filtradas = filtrarOfertasPlatos(ofertasEnriquecidas, filtros)
    return ordenarOfertasPlatos(filtradas, filtros.ordenamiento)
  }, [ofertasEnriquecidas, filtros])

  return {
    restaurantes,
    resultadosBusquedaPlato,
    mejoresOfertas,
    filtros,
    cargando,
    cargandoOfertas,
    error,
    modoBusqueda,
    terminoBusqueda,
    cargarZona,
    buscarPlato,
    aplicarFiltros,
    limpiarFiltros,
    recargar,
    setOrdenamiento: (orden) => setFiltros((f) => ({ ...f, ordenamiento: orden })),
    hayFiltrosActivos: hayFiltrosActivos(filtros),
  }
}
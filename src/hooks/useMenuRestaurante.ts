import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  MenuApiError,
  obtenerMenuRestaurante,
  type MenuResponse,
} from "../api/menuApi.js";
import { listarProductosOfertaEnZona } from "../api/productosClienteApi.js";
import type { DTORestaurante } from "../data/DTORestaurante.js";
import { leerCoordsGuardadas } from "./useGeolocation.js";
import {
  productosConOferta,
  sanitizarOfertasCliente,
} from "../utils/productos.js";

function normalizarIdRestaurante(
  id: number | string | undefined,
): number | undefined {
  if (id == null || id === "") return undefined;
  const n = Number(id);
  return Number.isNaN(n) ? undefined : n;
}

function idsOfertaActivaDelRestaurante(
  ofertasZona: Awaited<ReturnType<typeof listarProductosOfertaEnZona>>,
  idRestaurante: number,
): Set<number> {
  return new Set(
    ofertasZona
      .filter((o: DTORestaurante) => Number(o.idRestaurante) === idRestaurante)
      .map((o: DTORestaurante) => o.productos)
      .filter((id: number): id is number => id != null),
  );
}

export function useMenuRestaurante(
  idRestauranteParam: number | string | undefined,
) {
  const idRestaurante = normalizarIdRestaurante(idRestauranteParam);

  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mantenemos estos estados para controlar el filtrado en el cliente
  const [categoria, setCategoria] = useState("");
  const [ordenPrecio, setOrdenPrecio] = useState("");
  const [idsOfertaActiva, setIdsOfertaActiva] = useState<Set<number>>(new Set());

  const restauranteRef = useRef<DTORestaurante | null>(null);

  // 1. AHORA 'cargar' NO depende de 'categoria' ni 'ordenPrecio'
  const cargar = useCallback(async () => {
    if (idRestaurante == null) return;

    setCargando(true);
    setError(null);
    const coords = leerCoordsGuardadas();

    try {
      const [data, ofertasZona] = await Promise.all([
        // Llamamos a la API sin mandarle opciones de filtro (trae TODO el menú)
        obtenerMenuRestaurante(idRestaurante),

        coords
          ? listarProductosOfertaEnZona(coords).catch(() => [])
          : Promise.resolve([]),
      ]);

      if (data.restaurante) {
        restauranteRef.current = data.restaurante;
      }

      setIdsOfertaActiva(
        idsOfertaActivaDelRestaurante(ofertasZona, idRestaurante),
      );

      setMenu(data);
    } catch (e: unknown) {
      if (e instanceof MenuApiError && e.status === 404) {
        setError("El restaurante no existe o no está disponible");
      } else {
        setError(e instanceof Error ? e.message : "Error al cargar el menú");
      }
      setMenu(null);
      setIdsOfertaActiva(new Set());
    } finally {
      setCargando(false);
    }
  }, [idRestaurante]); // <-- Solo se vuelve a ejecutar si cambia el ID del restaurante

  useEffect(() => {
    cargar();
  }, [cargar]);

  // 2. Guardamos y sanitizamos la lista COMPLETA de productos que vino del backend
  const todosLosProductos = useMemo(
    () => sanitizarOfertasCliente(menu?.productos ?? [], idsOfertaActiva),
    [menu?.productos, idsOfertaActiva],
  );

  // Filtramos y ordenamos
const productosFiltrados = useMemo(() => {
  let resultado = [...todosLosProductos];

  // Filtrar por categoría 
  if (categoria) {
    resultado = resultado.filter((p) => {
      if (!p.categoria) return false;
      return p.categoria.toString().toLowerCase() === categoria.toString().toLowerCase();
    });
  }

  // Ordenar por precio
  if (ordenPrecio) {
    resultado.sort((a, b) => {
      const precioA = a.precio ?? 0;
      const precioB = b.precio ?? 0;

      // Soporta tanto los valores que envíe el Sidebar
      if (ordenPrecio === "menor-precio" || ordenPrecio === "asc") {
        return precioA - precioB;
      }
      if (ordenPrecio === "mayor-precio" || ordenPrecio === "desc") {
        return precioB - precioA;
      }
      return 0;
    });
  }

  return resultado;
}, [todosLosProductos, categoria, ordenPrecio]);

  // Las ofertas las extraemos de los productos que están visibles actualmente
  const ofertas = useMemo(() => productosConOferta(productosFiltrados), [productosFiltrados]);

  // Si no hay absolutamente ningún producto cargado de base en el restaurante
  const sinProductos =
    (!!menu?.restaurante || !!menu?.mensaje) &&
    !categoria &&
    todosLosProductos.length === 0;

  // Si hay productos pero ninguno coincide con la categoría seleccionada
  const sinProductosEnCategoria =
    !!categoria && productosFiltrados.length === 0 && !!menu?.restaurante;

  return {
    menu,
    cargando,
    error,
    categoria,
    setCategoria,
    ordenPrecio,
    setOrdenPrecio,
    productosFiltrados,
    ofertas,
    sinProductos,
    sinProductosEnCategoria,
    recargar: cargar,
  };
}
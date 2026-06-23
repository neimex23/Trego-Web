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

  const [categoria, setCategoria] = useState("");

  const [ordenPrecio, setOrdenPrecio] = useState("");

  const [idsOfertaActiva, setIdsOfertaActiva] = useState<Set<number>>(
    new Set(),
  );

  const restauranteRef = useRef<DTORestaurante | null>(null);

  const cargar = useCallback(async () => {
    if (idRestaurante == null) return;

    setCargando(true);

    setError(null);

    const coords = leerCoordsGuardadas();

    try {
      const [data, ofertasZona] = await Promise.all([
        obtenerMenuRestaurante(idRestaurante, { categoria, ordenPrecio }),

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
  }, [idRestaurante, categoria, ordenPrecio]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const productos = useMemo(
    () => sanitizarOfertasCliente(menu?.productos ?? [], idsOfertaActiva),

    [menu?.productos, idsOfertaActiva],
  );

  const ofertas = useMemo(() => productosConOferta(productos), [productos]);

  const sinProductos =
    (!!menu?.restaurante || !!menu?.mensaje) &&
    !categoria &&
    productos.length === 0;

  const sinProductosEnCategoria =
    !!categoria && productos.length === 0 && !!menu?.restaurante;

  return {
    menu,

    cargando,

    error,

    categoria,

    setCategoria,

    ordenPrecio,

    setOrdenPrecio,

    productosFiltrados: productos,

    ofertas,

    sinProductos,

    sinProductosEnCategoria,

    recargar: cargar,
  };
}

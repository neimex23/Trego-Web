import { useCallback, useEffect, useMemo, useState } from "react";
import { listarPedidos } from "../api/apiRestaurante.js";
import { listarReclamos } from "../api/reclamosApi.js";
import type { DTOReclamo } from "../data/DTOReclamo.js";
import { EnumEstadoPedido } from "../data/EnumEstadoPedido.js";
import {
  EnumEstadoReclamo,
  ESTADOS_RECLAMO_FILTRO,
} from "../data/EnumEstadoReclamo.js";

const DEBOUNCE_MS = 400;

async function enriquecerTotalesPedido(
  reclamos: DTOReclamo[],
): Promise<DTOReclamo[]> {
  const faltanTotal = reclamos.some(
    (r) => r.totalPedido == null || !Number.isFinite(Number(r.totalPedido)),
  );
  if (!faltanTotal) return reclamos;

  const totalesPorPedido = new Map<number, number>();

  for (const estado of [
    EnumEstadoPedido.Entregado,
    EnumEstadoPedido.Reembolsado,
  ]) {
    try {
      const pedidos = await listarPedidos({ estado });
      for (const pedido of pedidos) {
        if (
          pedido.idPedido != null &&
          pedido.total != null &&
          Number.isFinite(pedido.total)
        ) {
          totalesPorPedido.set(pedido.idPedido, pedido.total);
        }
      }
    } catch {}
  }

  return reclamos.map((reclamo) => ({
    ...reclamo,
    totalPedido:
      reclamo.totalPedido != null &&
      Number.isFinite(Number(reclamo.totalPedido))
        ? Number(reclamo.totalPedido)
        : (totalesPorPedido.get(reclamo.idPedido) ?? null),
  }));
}

export function useReclamos() {
  const [reclamos, setReclamos] = useState<DTOReclamo[]>([]);
  const [totalPendientes, setTotalPendientes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<
    EnumEstadoReclamo | undefined
  >(undefined);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [orden, setOrden] = useState<"ASC" | "DESC">("DESC");

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(searchTerm.trim()),
      DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const esId = /^\d+$/.test(debouncedSearch);
      const params: Record<string, any> = {};
      if (debouncedSearch && !esId) params.nombre = debouncedSearch;
      if (estadoFiltro) params.estado = estadoFiltro;
      if (fechaDesde) params.fechaDesde = fechaDesde;
      if (fechaHasta) params.fechaHasta = fechaHasta;

      const data = await listarReclamos(params);
      setReclamos(await enriquecerTotalesPedido(data));

      const queryActiva =
        !!estadoFiltro || !!fechaDesde || !!fechaHasta || !!debouncedSearch;

      if (!queryActiva) {
        const count = data.filter(
          (r) => r.estado === EnumEstadoReclamo.Pendiente,
        ).length;
        setTotalPendientes(count);
      } else {
        try {
          const dataGlobalPendientes = await listarReclamos({
            estado: EnumEstadoReclamo.Pendiente,
          });
          setTotalPendientes(dataGlobalPendientes.length);
        } catch {
          const countLocal = data.filter(
            (r) => r.estado === EnumEstadoReclamo.Pendiente,
          ).length;
          setTotalPendientes(countLocal);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar los reclamos");
      setReclamos([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, estadoFiltro, fechaDesde, fechaHasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const reclamosFiltrados = useMemo(() => {
    let lista = [...reclamos];
    const term = debouncedSearch;

    if (term && /^\d+$/.test(term)) {
      lista = lista.filter((r) => String(r.idPedido).includes(term));
    }

    lista.sort((a, b) => {
      const fa = a.fechaReclamo ? new Date(a.fechaReclamo).getTime() : 0;
      const fb = b.fechaReclamo ? new Date(b.fechaReclamo).getTime() : 0;
      return orden === "ASC" ? fa - fb : fb - fa;
    });

    return lista;
  }, [reclamos, debouncedSearch, orden]);

  const hayFiltros =
    !!searchTerm.trim() || !!estadoFiltro || !!fechaDesde || !!fechaHasta;

  const limpiarFiltros = useCallback(() => {
    setSearchTerm("");
    setEstadoFiltro(undefined);
    setFechaDesde("");
    setFechaHasta("");
  }, []);

  return {
    reclamos: reclamosFiltrados,
    totalPendientes,
    loading,
    error,
    recargar: cargar,
    searchTerm,
    setSearchTerm,
    estadoFiltro,
    setEstadoFiltro,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    orden,
    setOrden,
    hayFiltros,
    limpiarFiltros,
    estadosDisponibles: ESTADOS_RECLAMO_FILTRO,
  };
}

import { useEffect, useState } from "react";
import type { EnumEstadoPedido } from "../data/EnumEstadoPedido.js";
import type { DTOPedido } from "../data/DTOPedido.js";
import { listarPedidos } from "../api/apiRestaurante.js";

export function usePedidos(estado: EnumEstadoPedido, intervaloSegundos = 15) {
  const [pedidos, setPedidos] = useState<DTOPedido[]>([]);
  // El loading ahora representará SOLO la carga inicial
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Añadimos un parámetro 'silencioso' que por defecto es falso
  const fetchPedidos = async (silencioso = false) => {
    // Si no es silencioso (carga inicial), mostramos el spinner
    if (!silencioso) setLoading(true);
    setError(null);

    try {
      const data = await listarPedidos({ estado });
      // Aquí asumo que tu lógica original de errores se mantiene
      const errores: DTOPedido[] = [];

      // No renderizar si no cambio nada  
      setPedidos((prev) => {
        if (
          prev.length === data.length &&
          prev.every(
            (p, i) =>
              p.idPedido === data[i]?.idPedido && p.estado === data[i]?.estado,
          )
        ) {
          return prev;
        }
        return data;
      });

      if (errores.length > 0) {
        setError(
          `${errores.length} pedido(s) ignorado(s) por no contener productos.`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar pedidos");
    } finally {
      // Solo quitamos el loading si fue una carga principal
      if (!silencioso) setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Ejecutar la primera carga con spinner
    fetchPedidos(false);

    // 2. Configurar el Polling (consultar cada X segundos en modo silencioso)
    const intervalId = setInterval(() => {
      fetchPedidos(true); // true = silencioso, actualiza datos sin mostrar spinner
    }, intervaloSegundos * 1000);

    // 3. Limpiar el intervalo cuando el usuario cambie de pantalla
    return () => clearInterval(intervalId);
  }, [estado]);

  const removerPedidoLocal = (idPedido: number) => {
    setPedidos((prevPedidos) =>
      prevPedidos.filter((p) => p.idPedido !== idPedido),
    );
  };

  return {
    pedidos,
    loading,
    error,
    recargar: () => fetchPedidos(false), // Recarga manual (con spinner)
    recargarSilencioso: () => fetchPedidos(true),
    removerPedidoLocal,
  };
}

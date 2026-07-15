import { createContext, useContext, useMemo, useCallback, type ReactNode } from "react";
import { usePedidos } from "../hooks/usePedidoRestaurante.js"; 
import { EnumEstadoPedido } from "../data/EnumEstadoPedido.js"; 
import { useReclamos } from "../hooks/useReclamos.js";

interface PedidosContextType {
  counts: Record<string, number>;
  pedidosEspera: ReturnType<typeof usePedidos>;
  pedidosPreparacion: ReturnType<typeof usePedidos>;
  pedidosEnCamino: ReturnType<typeof usePedidos>;
  pedidosReclamados: ReturnType<typeof useReclamos>;
  refrescarListas: (estados: EnumEstadoPedido[]) => Promise<void>;
}

const PedidosContext = createContext<PedidosContextType | undefined>(undefined);

export function PedidosProvider({ children }: { children: ReactNode }) {
  const pedidosEspera = usePedidos(EnumEstadoPedido.Pagado, 20);
  const pedidosPreparacion = usePedidos(EnumEstadoPedido.EnPreparacion, 500);
  const pedidosEnCamino = usePedidos(EnumEstadoPedido.EnCamino, 500);
  const pedidosReclamados = useReclamos();

  const counts = useMemo(() => ({
    [EnumEstadoPedido.Pagado]: pedidosEspera.pedidos.length,
    [EnumEstadoPedido.EnPreparacion]: pedidosPreparacion.pedidos.length,
    [EnumEstadoPedido.EnCamino]: pedidosEnCamino.pedidos.length,
    "Reclamos": pedidosReclamados.totalPendientes,
  }), [
    pedidosEspera.pedidos.length,
    pedidosPreparacion.pedidos.length,
    pedidosEnCamino.pedidos.length,
    pedidosReclamados.totalPendientes
  ]);

  const refrescarListas = useCallback(async (estados: EnumEstadoPedido[]) => {
    const promesas: Promise<void>[] = [];

    if (estados.includes(EnumEstadoPedido.Pagado)) {
      promesas.push(pedidosEspera.recargarSilencioso());
    }
    if (estados.includes(EnumEstadoPedido.EnPreparacion)) {
      promesas.push(pedidosPreparacion.recargarSilencioso());
    }
    if (estados.includes(EnumEstadoPedido.EnCamino)) {
      promesas.push(pedidosEnCamino.recargarSilencioso());
    }

    await Promise.all(promesas);
  }, [pedidosEspera, pedidosPreparacion, pedidosEnCamino]);

  const contextValue = useMemo(() => ({
    counts,
    pedidosEspera,
    pedidosPreparacion,
    pedidosEnCamino,
    pedidosReclamados,
    refrescarListas
  }), [counts, pedidosEspera, pedidosPreparacion, pedidosEnCamino, pedidosReclamados, refrescarListas]);
  
  return (
    <PedidosContext.Provider value={contextValue}>
      {children}
    </PedidosContext.Provider>
  );
}

export function usePedidosContext() {
  const context = useContext(PedidosContext);
  if (!context) {
    throw new Error("usePedidosContext debe usarse dentro de PedidosProvider");
  }
  return context;
}
import type { DTOPedido } from "../data/DTOPedido.js";

export interface PedidoConFechaHora {
  pedido: DTOPedido;
  fecha: string;
  horario: string;
  fechaOrden: string;
}

export function extraerFechaYHorario(
  fechaCreacion: string | undefined,
): { fecha: string; horario: string } | null {
  if (!fechaCreacion) return null;

  const match = fechaCreacion.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
  );
  if (!match) return null;

  const [, anio, mes, dia, hora, minuto] = match;
  return {
    fecha: `${dia}/${mes}/${anio}`,
    horario: `${hora}:${minuto}`,
  };
}

export function pedidosEnRango(
  pedidos: DTOPedido[],
  fechaDesde: string,
  fechaHasta: string,
): PedidoConFechaHora[] {
  return pedidos
    .map((pedido) => {
      const parsed = extraerFechaYHorario(pedido.fechaCreacion);
      if (!parsed || !pedido.fechaCreacion) return null;

      const fechaClave = pedido.fechaCreacion.slice(0, 10);
      if (fechaClave < fechaDesde || fechaClave > fechaHasta) return null;

      return {
        pedido,
        fecha: parsed.fecha,
        horario: parsed.horario,
        fechaOrden: pedido.fechaCreacion,
      };
    })
    .filter((item): item is PedidoConFechaHora => item !== null)
    .sort((a, b) => a.fechaOrden.localeCompare(b.fechaOrden));
}

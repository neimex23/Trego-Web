import type { DTOProductoSimplificado } from "./DTOProductoSimplificado.js";

export interface DTOEstadisticas {
  fechaInicio?: string;
  fechaFin?: string;
  productosMasVendidos?: DTOProductoSimplificado[];
  ventasPorFecha?: Record<string, number>;
  ingresosPorFecha?: Record<string, number>;
}

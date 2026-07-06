import type { DTODireccion } from "./DTODireccion.js";
import type { DTOProductoPedido } from "./DTOProductoPedido.js";
import type { EnumEstadoPedido } from "./EnumEstadoPedido.js";

export interface DTOPedido {
  idPedido?: number;
  idCliente?: number;
  nombreCliente?: string;
  idRestaurante?: number;
  productos?: DTOProductoPedido[];
  direccionEntrega?: DTODireccion;
  total?: number;
  estado?: EnumEstadoPedido;
  fechaCreacion?: string;
  fechaExpiracion?: string;
  horaEntregaEstimada?: string;
  tiempoPreparacion?: number;
  tieneReclamo?: boolean;

}

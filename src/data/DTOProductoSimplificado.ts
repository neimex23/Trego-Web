import type { DTOOferta } from "./DTOOferta.js";

export interface DTOProductoSimplificado {
  idProducto?: number;
  idRestaurante?: number;
  nombre?: string;
  precio?: number;
  urlImagen?: string;
  oferta?: DTOOferta;
  tiempoPreparacion?: number;
  cantidadVendida?: number;
}
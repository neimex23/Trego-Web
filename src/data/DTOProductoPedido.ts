import type { DTOIngrediente } from "./DTOIngrediente.js";
import type { DTOProducto } from "./DTOProducto.js";
import type { DTOProductoSimplificado } from "./DTOProductoSimplificado.js";

export interface DTOProductoPedido {
  idLinea?: number;
  cantidadDisponible?: number;
  ingredientesAQuitar?: DTOIngrediente[];
  observaciones?: string;
  cantidad?: number;
  subtotal?: number;
  producto?: DTOProducto;
}
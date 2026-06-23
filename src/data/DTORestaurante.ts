import type { EnumCategoriaRestaurante } from "./CategoriaRestaurante.js";
import type { DTODireccion } from "./DTODireccion.js";
import type { DTOIngrediente } from "./DTOIngrediente.js";
import type { DTOProducto } from "./DTOProducto.js";

export interface DTORestaurante {
  idRestaurante?: number | null | undefined;
  nombre?: string;
  email?: string;
  password?: string;
  rut?: string;
  telefono?: string;
  fotoPerfil?: string;
  fotoPortada?: string;
  direccion?: DTODireccion;
  descripcion?: string;
  categoria?: EnumCategoriaRestaurante | null;
  calificacionProm?: number | null;
  radioEntrega?: number;
  habilitado?: boolean;
  /** Cuenta activa (false si el admin deshabilitó el acceso). Distinto de habilitado (aprobación). */
  cuentaHabilitada?: boolean;
  abierto?: boolean;
  horaApertura?: string | null;
  horaCierre?: string | null;
  productos?: DTOProducto[];
  ingredientesDisponibles?: DTOIngrediente[];
}

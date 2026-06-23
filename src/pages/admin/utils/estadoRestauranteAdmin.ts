import type { DTORestaurante } from "../../../data/DTORestaurante.js";

export type EstadoRestauranteAdmin = "habilitado" | "pendiente" | "deshabilitado";

export function obtenerEstadoRestaurante(
  restaurante: DTORestaurante,
): EstadoRestauranteAdmin {
  if (!restaurante.habilitado) return "pendiente";
  if (restaurante.cuentaHabilitada === false) return "deshabilitado";
  return "habilitado";
}

export function etiquetaEstadoRestaurante(estado: EstadoRestauranteAdmin): string {
  switch (estado) {
    case "habilitado":
      return "Habilitado";
    case "pendiente":
      return "Pendiente";
    case "deshabilitado":
      return "Deshabilitado";
  }
}

export function clasesBadgeEstadoRestaurante(estado: EstadoRestauranteAdmin): string {
  switch (estado) {
    case "habilitado":
      return "bg-green-50 text-green-700";
    case "pendiente":
      return "bg-amber-50 text-amber-700";
    case "deshabilitado":
      return "bg-red-50 text-red-700";
  }
}

export function esCuentaRestauranteActiva(restaurante: DTORestaurante): boolean {
  return restaurante.habilitado === true && restaurante.cuentaHabilitada !== false;
}

/** Normaliza el campo que el back puede enviar como `cuentahabilitada`. */
export function normalizarRestauranteAdmin(
  raw: DTORestaurante & { cuentahabilitada?: boolean },
): DTORestaurante {
  return {
    ...raw,
    cuentaHabilitada: raw.cuentaHabilitada ?? raw.cuentahabilitada ?? true,
  };
}

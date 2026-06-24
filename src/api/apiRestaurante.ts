import type { DTOAbrirCerrarLocalRequest } from "../data/DTOAbrirCerrarLocalRequest.js";
import type { DTOEstadisticas } from "../data/DTOEstadisticas.js";
import type { DTOFirma } from "../data/DTOFirma.js";
import type { DTOIngrediente } from "../data/DTOIngrediente.js";
import type { DTOModificarOfertaRequest } from "../data/DTOModificarOfertaRequest.js";
import type { DTOOferta } from "../data/DTOOferta.js";
import type { DTOPedido } from "../data/DTOPedido.js";
import type { DTOProducto } from "../data/DTOProducto.js";
import type { DTORestaurante } from "../data/DTORestaurante.js";
import type { DTOSubcategoria } from "../data/DTOSubcategoria.js";
import { EnumEstadoPedido } from "../data/EnumEstadoPedido.js";
import { ENDPOINTS } from "./endpoints.js";
import { fetchConAuth } from "./header/fetchConAuth.js";

interface FiltrosPedido {
  estado?: EnumEstadoPedido;
  idProducto?: number;
}

// DTO esperado por el backend a la gora de Actualizar un estado de pedido
export interface DTOActualizarEstadoRequest {
  pedido: DTOPedido; // pedido a actualizar
  estado: EnumEstadoPedido; // nuevo estado
}

/**
 * Eniva una solicitud de alta al backend para que posteriormente sea habilitado por un Administrador
 * @param resto Datos del restaurante Solicitante
 * @returns
 */
export async function enviarSolicitudAltaRestaurante(
  resto: Partial<DTORestaurante>,
) {
  const response = await fetchConAuth(ENDPOINTS.SOLICITUD_ALTA_RESTAURANTE, {
    method: "PATCH",
    body: JSON.stringify(resto),
  });
  if (!response.ok) {
    throw new Error("No se pudo enviar la solicitud de alta");
  }
  return response.json();
}

/**
 * Obtiene una firma de Cloudinary que permite subir posteriormente la imagen
 * @param nombreArchivo Nombre del archivo que se va a firmar en Cloudinary
 * @param tipo Tipo de archivo que se va a subir a Cloudinary
 * @returns Retorna la firma con los parametros que aceptara Cloudinary a la hora de subir una imagen
 */
export async function obtenerFirmaCloudinary(
  nombreArchivo: string,
  tipo: "image" | "video" | "raw" = "image",
): Promise<DTOFirma> {
  // Limpiamos el nombre de espacios o caracteres raros por las dudas
  const nombreLimpio = encodeURIComponent(nombreArchivo.trim());
  const url = `${ENDPOINTS.FIRMA_IMAGEN}/${nombreLimpio}/${tipo}`;

  const response = await fetchConAuth(url, {
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Error desconocido");
    throw new Error(`No se pudo obtener la firma de Cloudinary: ${errorText}`);
  }

  return response.json();
}

/**
 * Devuelve un restaurante en base del token de sesion que tiene el restaurante
 * @returns Retorna el restaurante actual
 */
export async function obtenerActual(): Promise<DTORestaurante> {
  const response = await fetchConAuth(ENDPOINTS.OBTENER_RESTAURANTE_ACTUAL, {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Error desconocido");
    throw new Error(
      `No se pudo obtener la informacion del restaurante: ${errorText}`,
    );
  }

  return response.json();
}

/**
 * Ingresa un producto creado por el restaurante y lo ingresa a su lista de productos
 * @param producto Producto creado por el restaurante
 */
export async function agregarProducto(producto: DTOProducto): Promise<void> {
  const response = await fetchConAuth("/api/productos/agregarProducto", {
    method: "POST",
    body: JSON.stringify(producto),
  });

  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }

    console.error("❌ Error al agregar producto:", response.status, mensaje);
    throw new Error(mensaje);
  }
}

/**
 * Obtiene la lista de ingredientes del restaurante autenticado.
 * @returns Promise con array de DTOIngrediente.
 * @throws Error si el restaurante no existe (404) o si ocurre otro error.
 */
export async function listarIngredientes(): Promise<DTOIngrediente[]> {
  const response = await fetchConAuth(ENDPOINTS.LISTAR_INGREDIENTES);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Restaurante no encontrado");
    }
    const errorText = await response.text().catch(() => "Error desconocido");
    throw new Error(errorText || "Error al obtener los ingredientes");
  }

  return response.json();
}

/**
 * Crea un nuevo ingrediente en DB
 * @param nombre Nombre del ingrediente
 * @returns Devuelve el infrediente en su estado de DB
 */
export async function crearIngrediente(
  nombre: string,
): Promise<DTOIngrediente> {
  const response = await fetchConAuth(
    `${ENDPOINTS.AGREGAR_INGREDIENTE}/${encodeURIComponent(nombre)}`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Error al crear el ingrediente");
  }

  return response.json();
}

/**
 * Obtiene todos los productos del restaurante autenticado.
 * @returns Promise con array de DTOProducto.
 * @throws Error si hay problemas de autenticación (403) o no se encuentran productos (404).
 */
export async function listarProductos(): Promise<DTOProducto[]> {
  const response = await fetchConAuth(ENDPOINTS.LISTAR_PRODUCTOS);

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("No tiene permisos para listar los productos.");
    }
    if (response.status === 404) {
      throw new Error("No se encontraron productos en el sistema.");
    }
    const errorText = await response.text().catch(() => "Error desconocido");
    throw new Error(errorText || "Error al listar los productos.");
  }

  return response.json();
}

export async function modificarProducto(
  producto: DTOProducto,
): Promise<DTOProducto> {
  const response = await fetchConAuth(ENDPOINTS.MODIFICAR_PRODUCTO, {
    method: "PATCH",
    body: JSON.stringify(producto),
  });

  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }
    throw new Error(mensaje);
  }

  return response.json();
}

/**
 * Deshabilita un producto (disponible = false).
 * @param idProducto - ID del producto a deshabilitar.
 * @throws Error con el mensaje de error del backend o un mensaje genérico.
 */
export async function deshabilitarProducto(idProducto: number): Promise<void> {
  const url = `${ENDPOINTS.DESHABILITAR_PRODUCTO}/${idProducto}/deshabilitar`;

  const response = await fetchConAuth(url, { method: "PATCH" });

  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }
    throw new Error(mensaje);
  }
}

/**
 * Habilita un producto .
 * @param idProducto - ID del producto a deshabilitar.
 * @throws Error con el mensaje de error del backend o un mensaje genérico.
 */
export async function habilitarProducto(idProducto: number): Promise<void> {
  const url = `${ENDPOINTS.DESHABILITAR_PRODUCTO}/${idProducto}/habilitar`;

  const response = await fetchConAuth(url, { method: "PATCH" });

  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }
    throw new Error(mensaje);
  }
}

/**
 * Obtiene los pedidos del restaurante autenticado, opcionalmente filtrados por estado y/o producto.
 * @param filtros - Objeto opcional con `estado` y/o `idProducto`.
 * @returns Promise con array de DTOPedido.
 */
export async function listarPedidos(
  filtros?: FiltrosPedido,
): Promise<DTOPedido[]> {
  const params = new URLSearchParams();
  if (filtros?.estado) params.append("estado", filtros.estado);
  if (filtros?.idProducto != null)
    params.append("idProducto", String(filtros.idProducto));

  const query = params.toString();
  const url = `${ENDPOINTS.LISTAR_PEDIDOS}${query ? `?${query}` : ""}`;

  const response = await fetchConAuth(url);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Error desconocido");
    throw new Error(errorText || "Error al listar los pedidos");
  }

  return response.json();
}

/** Une pedidos de todos los estados del restaurante autenticado. */
export async function listarTodosPedidosRestaurante(): Promise<DTOPedido[]> {
  const estados = Object.values(EnumEstadoPedido).filter(
    (valor): valor is EnumEstadoPedido => typeof valor === "string",
  );

  const listas = await Promise.all(
    estados.map((estado) => listarPedidos({ estado })),
  );

  const porId = new Map<number, DTOPedido>();
  for (const pedidos of listas) {
    for (const pedido of pedidos) {
      if (pedido.idPedido != null) {
        porId.set(pedido.idPedido, pedido);
      }
    }
  }

  return [...porId.values()];
}

/**
 * Obtiene todas las subcategorías disponibles.
 * @returns Promise con un array de DTOSubcategoria.
 */
export async function listarSubcategorias(): Promise<DTOSubcategoria[]> {
  const response = await fetchConAuth(ENDPOINTS.LISTAR_SUBCATEGORIAS);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Error desconocido");
    throw new Error(errorText || "Error al listar las subcategorías");
  }

  return response.json();
}

/**
 * Confirma un pedido desde el restaurante.
 * @param pedidoId - ID del pedido a confirmar.
 * @returns El pedido actualizado con su nuevo estado.
 * @throws Error con el mensaje del backend si falla (400/409/500).
 */
export async function confirmarPedidoRestaurante(
  pedidoId: number,
): Promise<DTOPedido> {
  const response = await fetchConAuth(
    `${ENDPOINTS.CONFIRMAR_PEDIDO}/${pedidoId}`,
    {
      method: "PATCH",
    },
  );

  if (!response.ok) {
    // Intentamos extraer el mensaje de error del cuerpo de la respuesta
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }

    // Errores específicos según el backend
    if (response.status === 400) {
      throw new Error(mensaje || "El pedido no está en estado Pagado.");
    }
    if (response.status === 409) {
      throw new Error(
        mensaje || "El pedido ya fue cancelado o confirmado previamente.",
      );
    }

    throw new Error(mensaje || "Error al confirmar el pedido.");
  }

  return response.json();
}

/**
 * Actualiza el estado de un pedido (ej. a "EnCamino" o "Entregado").
 * @param request - Objeto con el ID del pedido y el nuevo estado.
 * @returns El pedido actualizado.
 * @throws Error si el salto de estado es inválido (400) u otro error.
 */
export async function actualizarEstadoPedido(
  request: DTOActualizarEstadoRequest,
): Promise<DTOPedido> {
  const response = await fetchConAuth(ENDPOINTS.ACTUALIZAR_ESTADO, {
    method: "PATCH",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }

    if (response.status === 400) {
      throw new Error(mensaje || "Salto de estado inválido.");
    }

    throw new Error(mensaje || "Error al actualizar el estado del pedido.");
  }

  return response.json();
}

/**
 * Solicita el reembolso de un pedido al backend.
 * @param pedido - pedido a reembolsar.
 * @returns El pedido actualizado con estado "Reembolsado".
 * @throws Error con mensaje descriptivo si falla.
 */
export async function reembolsarPedido(pedido: DTOPedido): Promise<DTOPedido> {
  const response = await fetchConAuth(ENDPOINTS.CANCELAR_PEDIDO, {
    method: "POST",
    body: JSON.stringify(pedido),
  });

  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }

    if (response.status === 400) {
      throw new Error(mensaje || "Pedido inválido o no tiene pago asociado.");
    }
    if (response.status === 409) {
      throw new Error(mensaje || "El pedido ya había sido reembolsado.");
    }

    throw new Error(mensaje || "Error al procesar el reembolso.");
  }

  return response.json();
}

/**
 * Abre un restaurante al publico
 * @param horaCierre - Hora en la que cerrara el Restaurante.
 * @returns Nada.
 * @throws Error con el mensaje del backend si falla (400/409/500).
 */
export async function abrirLocal(
  cierre: DTOAbrirCerrarLocalRequest,
): Promise<void> {
  const response = await fetchConAuth(`${ENDPOINTS.ABRIR_LOCAL}`, {
    method: "PATCH",
    body: JSON.stringify(cierre),
  });

  if (!response.ok) {
    // Intentamos extraer el mensaje de error del cuerpo de la respuesta
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }

    // Errores específicos según el backend
    if (response.status === 400) {
      throw new Error(mensaje || "Falta la hora de cierre.");
    }
    if (response.status === 409) {
      throw new Error(mensaje || "El local aun no tiene productos cargados.");
    }

    throw new Error(mensaje || "Error al abrir el local.");
  }

  return;
}

/**
 * Cierra un local abierto
 * @returns No retorna nada
 */
export async function cerrarLocal(): Promise<void> {
  const response = await fetchConAuth(`${ENDPOINTS.CERRAR_LOCAL}`, {
    method: "PATCH",
  });

  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }

    // Errores específicos según el backend
    if (response.status === 409) {
      throw new Error(mensaje || "El local ya se encontraba cerrado");
    }
    if (response.status === 404) {
      throw new Error(mensaje || "Restaurante no encontrado");
    }

    throw new Error(mensaje || "Error al cerrar el local");
  }
  return response.json().catch(() => undefined);
}

/**
 * Actualiza la hora de cierre de un restaurante
 * @param horaCierre - Hora en la que cerrara el Restaurante.
 * @returns Nada.
 * @throws Error con el mensaje del backend si falla (400/409/500).
 */
export async function actualizarHoraCierre(cierre: string): Promise<void> {
  const response = await fetchConAuth(`${ENDPOINTS.ACTUALIZAR_CIERRE}`, {
    method: "PATCH",
    body: JSON.stringify({ horaCierre: cierre }),
  });

  if (!response.ok) {
    // Intentamos extraer el mensaje de error del cuerpo de la respuesta
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }

    // Errores específicos según el backend
    if (response.status === 400) {
      throw new Error(mensaje || "Falta la hora de cierre.");
    }
    if (response.status === 404) {
      throw new Error(mensaje || "Restaurante no encontrado.");
    }

    throw new Error(mensaje || "Error al actualizar la hora.");
  }

  return;
}

/**
 * Fija manualmente el instante exacto de cierre programado del local.
 * @param cierre - Fecha/hora de cierre en formato datetime-local ("YYYY-MM-DDTHH:mm").
 * @throws Error con el mensaje del backend si falla (400/404/409).
 */
export async function actualizarCierreProgramado(cierre: string): Promise<void> {
  const response = await fetchConAuth(
    `${ENDPOINTS.ACTUALIZAR_CIERRE_PROGRAMADO}`,
    {
      method: "PATCH",
      body: JSON.stringify({ cierreProgramado: cierre }),
    },
  );

  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }

    if (response.status === 400) {
      throw new Error(mensaje || "El cierre programado debe ser una fecha futura.");
    }
    if (response.status === 404) {
      throw new Error(mensaje || "Restaurante no encontrado.");
    }
    if (response.status === 409) {
      throw new Error(mensaje || "El local debe estar abierto.");
    }

    throw new Error(mensaje || "Error al actualizar el cierre programado.");
  }

  return;
}

/**
 * Modifica el perfil de un restaurante registrado
 * @param resto Datos nuevos del restaurante a modificar
 * @returns
 */
export async function modificarRestaurantePerfil(
  resto: DTORestaurante,
): Promise<void> {
  const response = await fetchConAuth(ENDPOINTS.RESTAURANTE_MODIFICAR_PERFIL, {
    method: "PATCH",
    body: JSON.stringify(resto),
  });

  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }
    throw new Error(mensaje);
  }

  return response.json();
}

/**
 * Crea una nueva oferta para el restaurante autenticado.
 * @param request - Datos de la oferta (DTOOferta)
 * @param idProducto - ID del producto al que se asocia la oferta
 * @returns Promise con la oferta creada (DTOOferta)
 * @throws Error si la respuesta no es exitosa
 */
export async function crearOferta(
  request: DTOOferta,
  idProducto: number,
): Promise<DTOOferta> {
  const response = await fetchConAuth(
    `${ENDPOINTS.CREAR_OFERTA}?idProducto=${idProducto}`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = await response.text().catch(() => errorMessage);
    }
    throw new Error(errorMessage);
  }

  const data: DTOOferta = await response.json();
  return data;
}

/**
 * Obtiene estadísticas del restaurante autenticado en un rango de fechas.
 */
export async function obtenerEstadisticas(
  fechaInicio: string,
  fechaFin: string,
): Promise<DTOEstadisticas> {
  const response = await fetchConAuth(ENDPOINTS.RESTAURANTE_ESTADISTICAS, {
    method: "POST",
    body: JSON.stringify({ fechaInicio, fechaFin }),
  });

  if (!response.ok) {
    let mensaje = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      mensaje =
        errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      mensaje = await response.text().catch(() => "Error desconocido");
    }

    if (response.status === 400) {
      throw new Error(
        mensaje || "Se requieren ambas fechas para filtrar estadísticas.",
      );
    }
    if (response.status === 403) {
      throw new Error(
        mensaje || "Solo los restaurantes pueden obtener estadísticas.",
      );
    }

    throw new Error(mensaje || "Error al obtener las estadísticas.");
  }

  return response.json();
}

/**
 * Desactiva una oferta para un restaurante autenticado.
 * @param request - Datos de la oferta a modificar
 * @throws Error si la respuesta no es exitosa
 */
export async function activarDesactivarOferta(
  request: DTOModificarOfertaRequest,
): Promise<void> {
  const response = await fetchConAuth(ENDPOINTS.ACTIVAR_DESACTIVAR_OFERTA, {
    method: "POST",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = await response.text().catch(() => errorMessage);
    }
    throw new Error(errorMessage);
  }
}

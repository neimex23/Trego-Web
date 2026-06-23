import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DTOProductoPedido } from "../data/DTOProductoPedido.js";
import type { DTOCarrito } from "../data/DTOCarito.js";
import type { DTORestaurante } from "../data/DTORestaurante.js";
import type { DTOProducto } from "../data/DTOProducto.js";
import type { DTODireccion } from "../data/DTODireccion.js";
import type { DTOIngrediente } from "../data/DTOIngrediente.js";
import { esSesionCliente } from "../utils/sesion.js";
import {
  agregarProductoAlCarritoApi,
  eliminarCarritoCompleto,
  eliminarProductoDelCarrito,
  modificarProductoEnCarrito,
  obtenerCarrito,
} from "../api/carritoApi.js";
import { obtenerDireccionesGuardadas } from "../api/usuariosApi.js";
import { confirmarPedido } from "../api/pedidosApi.js";
import { armarProductoPedidoRequest } from "../api/mapeadores.js";
import { mensajeAmigableApi } from "../utils/mensajesError.js";

function sonMismosIngredientes(
  a: DTOIngrediente[] | undefined,
  b: DTOIngrediente[] | undefined,
): boolean {
  const arrA = a ?? [];
  const arrB = b ?? [];
  if (arrA.length !== arrB.length) return false;
  const nombresA = [...arrA].map((i) => i.nombre).sort();
  const nombresB = [...arrB].map((i) => i.nombre).sort();
  return nombresA.every((nombre, idx) => nombre === nombresB[idx]);
}

/**
 * Fusiona líneas idénticas (mismo producto, mismas notas y mismos ingredientes a
 * quitar) sumando sus cantidades: si tras
 * editar una línea queda igual a otra, deben consolidarse en una sola.  */

function consolidarItems(items: DTOProductoPedido[]): DTOProductoPedido[] {
  const resultado: DTOProductoPedido[] = [];
  for (const item of items) {
    const idItem = item.producto?.idProducto ?? (item.producto as any)?.id;
    const existente = resultado.find((r) => {
      const idR = r.producto?.idProducto ?? (r.producto as any)?.id;
      return (
        idR === idItem &&
        (r.observaciones ?? "") === (item.observaciones ?? "") &&
        sonMismosIngredientes(r.ingredientesAQuitar, item.ingredientesAQuitar)
      );
    });
    if (existente) {
      existente.cantidad = (existente.cantidad ?? 0) + (item.cantidad ?? 0);
    } else {
      resultado.push({ ...item });
    }
  }
  return resultado;
}

export interface DireccionContexto {
  tipo: "guardada" | string;
  data: DTODireccion;
}

type ModalSuperiorType = "pago" | "direccion" | "carrito" | "detalle" | null;

// ==========================================
// INTERFAZ DEL CONTEXTO
// ==========================================

export interface CarritoContextType {
  items: DTOProductoPedido[];
  carritoDto: DTOCarrito | null;
  total: number;
  cantidadTotal: number;
  restaurante: DTORestaurante | null;
  carritoAbierto: boolean;
  productoEnDetalle: DTOProducto | null;
  restauranteDelDetalle: DTORestaurante | null;
  direccionModalAbierto: boolean;
  direcciones: DTODireccion[];
  direccionSeleccionada: DireccionContexto | null;
  pagoModalAbierto: boolean;
  mensajeCarrito: string | null;
  modalSuperior: ModalSuperiorType;
  cargandoCarrito: boolean;
  usarApi: boolean;
  restauranteAbierto: boolean;

  abrirCarrito: () => void;
  cerrarCarrito: () => void;
  abrirDetalleProducto: (
    producto: DTOProducto,
    restauranteInfo?: DTORestaurante | null,
  ) => void;
  cerrarDetalleProducto: () => void;
  abrirModalDireccion: () => void;
  cerrarModalDireccion: () => void;
  abrirModalPago: () => void;
  cerrarModalPago: () => void;
  setDireccionSeleccionada: React.Dispatch<
    React.SetStateAction<DireccionContexto | null>
  >;
  setMensajeCarrito: React.Dispatch<React.SetStateAction<string | null>>;
  vaciarCarrito: () => Promise<void>;
  agregarProductoAlCarrito: (
    args: DTOProductoPedido,
    restauranteInfo?: DTORestaurante | null,
  ) => Promise<boolean>;
  eliminarProducto: (index: number) => Promise<void>;
  cambiarCantidad: (index: number, nuevaCantidad: number) => Promise<void>;
  cambiarComentarios: (index: number, comentarios: string) => Promise<void>;
  cambiarIngredientesQuitados: (
    index: number,
    ingredientesQuitados: DTOIngrediente[],
  ) => Promise<void>;
  validarRestauranteAbierto: (estadoAbierto?: boolean) => boolean;
  cargarCarritoDesdeApi: (silencioso?: boolean) => Promise<void>; // <-- Nuevo parámetro
  cargarDireccionesDesdeApi: () => Promise<void>;
  confirmarPedidoYpagar: () => Promise<any>;
}

// ==========================================
// CONTEXTO Y FUNCIONES AUXILIARES
// ==========================================

const CarritoContext = createContext<CarritoContextType | null>(null);

const LS_KEY = "trego_carrito_v1";

function leerLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function guardarLS<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function tieneSesion(): boolean {
  return !!localStorage.getItem("jwtToken");
}

// ==========================================
// PROVIDER COMPONENT
// ==========================================

interface CarritoProviderProps {
  children: ReactNode;
}

export function CarritoProvider({ children }: CarritoProviderProps) {
  const [items, setItems] = useState<DTOProductoPedido[]>(() =>
    tieneSesion() ? [] : leerLS<DTOProductoPedido[]>(LS_KEY, []),
  );
  const [carritoDto, setCarritoDto] = useState<DTOCarrito | null>(null);
  const [restaurante, setRestaurante] = useState<DTORestaurante | null>(null);

  const [carritoAbierto, setCarritoAbierto] = useState<boolean>(false);
  const [productoEnDetalle, setProductoEnDetalle] =
    useState<DTOProducto | null>(null);
  const [restauranteDelDetalle, setRestauranteDelDetalle] =
    useState<DTORestaurante | null>(null);
  const [direccionModalAbierto, setDireccionModalAbierto] =
    useState<boolean>(false);
  const [direcciones, setDirecciones] = useState<DTODireccion[]>([]);
  const [direccionSeleccionada, setDireccionSeleccionada] =
    useState<DireccionContexto | null>(null);

  const [pagoModalAbierto, setPagoModalAbierto] = useState<boolean>(false);
  const [mensajeCarrito, setMensajeCarrito] = useState<string | null>(null);
  const [cargandoCarrito, setCargandoCarrito] = useState<boolean>(false);

  /** Evita que un GET lento del carrito pise un POST/PATCH reciente. */
  const carritoSyncGen = useRef(0);

  const invalidarCargasCarritoPendientes = useCallback(() => {
    carritoSyncGen.current += 1;
  }, []);

  const usarApi = tieneSesion() && esSesionCliente();

  const restauranteAbierto = useMemo(() => {
    // Si no hay restaurante, asumimos cerrado
    if (!restaurante) return false;

    // Si el backend indica explícitamente que está cerrado (por vacaciones, etc.)
    if (restaurante.abierto === false) return false;

    // Si no tenemos horarios, devolvemos el valor de abierto que tenga (true por defecto)
    if (!restaurante.horaApertura || !restaurante.horaCierre) {
      return restaurante.abierto ?? true;
    }

    // Obtenemos la hora actual en formato HH:MM
    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;

    // Comparamos con los horarios (asumimos formato HH:MM)
    return (
      horaActual >= restaurante.horaApertura &&
      horaActual <= restaurante.horaCierre
    );
  }, [restaurante]);

  const aplicarCarritoDto = useCallback((dto: DTOCarrito | null) => {
    setCarritoDto(dto);
    if (dto) {
      setItems(dto.productos ?? []);
      if (dto.idRestaurante) {
        setRestaurante((prev) => ({
          idRestaurante: dto.idRestaurante ?? 0,
          nombre: prev?.nombre ?? "Restaurante",
          abierto: prev?.abierto ?? true,
        }));
      }
    } else {
      setItems([]);
      setRestaurante(null);
    }
  }, []);

  // AGREGADO: Parámetro silencioso para evitar que salte el CircularProgress
  const cargarCarritoDesdeApi = useCallback(
    async (silencioso = false) => {
      if (!tieneSesion()) return;
      const gen = ++carritoSyncGen.current;
      if (!silencioso) setCargandoCarrito(true);
      try {
        const dto = await obtenerCarrito();
        if (gen !== carritoSyncGen.current) return;
        aplicarCarritoDto(dto);
      } catch (err) {
        if (gen !== carritoSyncGen.current) return;
        console.warn("[Trego] No se pudo cargar el carrito", err);
      } finally {
        if (gen === carritoSyncGen.current && !silencioso) {
          setCargandoCarrito(false);
        }
      }
    },
    [aplicarCarritoDto],
  );

  const cargarDireccionesDesdeApi = useCallback(async () => {
    if (!tieneSesion()) return;
    try {
      const lista = await obtenerDireccionesGuardadas();
      setDirecciones(lista);
    } catch (err) {
      console.warn("[Trego] No se pudieron cargar direcciones", err);
    }
  }, []);

  useEffect(() => {
    if (tieneSesion() && esSesionCliente()) {
      cargarCarritoDesdeApi();
      cargarDireccionesDesdeApi();
    }

    function alIniciarSesion() {
      if (tieneSesion() && esSesionCliente()) {
        cargarCarritoDesdeApi();
        cargarDireccionesDesdeApi();
      }
    }

    window.addEventListener("trego-sesion-iniciada", alIniciarSesion);
    return () =>
      window.removeEventListener("trego-sesion-iniciada", alIniciarSesion);
  }, [cargarCarritoDesdeApi, cargarDireccionesDesdeApi]);

  useEffect(() => {
    if (!usarApi) guardarLS(LS_KEY, items);
  }, [items, usarApi]);

  const total = useMemo(() => {
    if (carritoDto?.total != null) return Number(carritoDto.total);
    return items.reduce(
      (acc, it) =>
        acc + (Number(it.producto?.precio) || 0) * (Number(it.cantidad) || 0),
      0,
    );
  }, [items, carritoDto]);

  const cantidadTotal = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0),
    [items],
  );

  const modalSuperior = useMemo<ModalSuperiorType>(() => {
    if (pagoModalAbierto) return "pago";
    if (direccionModalAbierto) return "direccion";
    if (carritoAbierto) return "carrito";
    if (productoEnDetalle) return "detalle";
    return null;
  }, [
    pagoModalAbierto,
    direccionModalAbierto,
    carritoAbierto,
    productoEnDetalle,
  ]);

  function abrirCarrito() {
    setCarritoAbierto(true);
    setMensajeCarrito(null);
    if (tieneSesion()) cargarCarritoDesdeApi();
  }

  function cerrarCarrito() {
    setCarritoAbierto(false);
    setMensajeCarrito(null);
  }

  function abrirDetalleProducto(
    producto: DTOProducto,
    restauranteInfo?: DTORestaurante | null,
  ) {
    if (restauranteInfo?.idRestaurante) {
      const id = Number(restauranteInfo.idRestaurante);
      setRestaurante((prev) => {
        if (prev?.idRestaurante != null && Number(prev.idRestaurante) === id) {
          return prev;
        }
        return {
          idRestaurante: id,
          nombre: restauranteInfo.nombre ?? "",
          abierto: restauranteInfo.abierto ?? true,
          horaApertura: restauranteInfo.horaApertura ?? null,
          horaCierre: restauranteInfo.horaCierre ?? null,
        };
      });
    }
    setProductoEnDetalle(producto);
    setRestauranteDelDetalle(restauranteInfo ?? null);
    setMensajeCarrito(null);
  }

  function cerrarDetalleProducto() {
    setProductoEnDetalle(null);
    setRestauranteDelDetalle(null);
  }

  function abrirModalDireccion() {
    if (tieneSesion()) cargarDireccionesDesdeApi();
    setDireccionModalAbierto(true);
  }

  function cerrarModalDireccion() {
    setDireccionModalAbierto(false);
  }

  function abrirModalPago() {
    setPagoModalAbierto(true);
  }

  function cerrarModalPago() {
    setPagoModalAbierto(false);
  }

  async function vaciarCarrito() {
    if (tieneSesion()) {
      try {
        await eliminarCarritoCompleto();
      } catch (err) {
        console.warn("[Trego] Error al vaciar carrito en servidor", err);
      }
    }
    setItems([]);
    setCarritoDto(null);
    setRestaurante(null);
    setDireccionSeleccionada(null);
  }

  async function asegurarRestaurante(
    restauranteInfo?: DTORestaurante | null,
  ): Promise<boolean> {
    if (!restauranteInfo?.idRestaurante) return true;

    const id = Number(restauranteInfo.idRestaurante);

    if (!restaurante?.idRestaurante) {
      setRestaurante({
        idRestaurante: id,
        nombre: restauranteInfo?.nombre ?? "",
        abierto: restauranteInfo?.abierto ?? true,
        horaApertura: restauranteInfo.horaApertura ?? null,
        horaCierre: restauranteInfo.horaCierre ?? null,
      });
      return true;
    }
    if (Number(restaurante.idRestaurante) === id) return true;

    if (tieneSesion()) {
      invalidarCargasCarritoPendientes();
      try {
        await eliminarCarritoCompleto();
      } catch {
        // Si falla el DELETE seguimos con carrito local limpio
      }
    }
    setItems([]);
    setCarritoDto(null);
    setDireccionSeleccionada(null);
    setRestaurante({
      idRestaurante: id,
      nombre: restauranteInfo?.nombre ?? "",
      abierto: restauranteInfo?.abierto ?? true,
      horaApertura: restauranteInfo.horaApertura ?? null,
      horaCierre: restauranteInfo.horaCierre ?? null,
    });
    setMensajeCarrito("Se vació el carrito porque cambiaste de restaurante.");
    return true;
  }

  async function agregarProductoAlCarrito(
    pedido: DTOProductoPedido,
    restauranteInfo?: DTORestaurante | null,
  ): Promise<boolean> {
    if (!pedido?.producto?.idProducto && !(pedido?.producto as any)?.id) {
      console.warn("Falta el producto o el idProducto");
      setMensajeCarrito("No se pudo agregar: producto inválido.");
      return false;
    }

    const producto = pedido.producto;

    try {
      await asegurarRestaurante(restauranteInfo);
    } catch (error) {
      console.error("Error en asegurarRestaurante:", error);
      setMensajeCarrito(
        "No podés agregar productos de un restaurante diferente.",
      );
      return false;
    }

    const idRestaurante =
      restauranteInfo?.idRestaurante ??
      pedido.producto?.idRestaurante ??
      restaurante?.idRestaurante;

    if (tieneSesion()) {
      invalidarCargasCarritoPendientes();
      try {
        const body = armarProductoPedidoRequest({
          producto,
          cantidad: pedido.cantidad,
          comentarios: pedido.observaciones,
          idRestaurante,
          ingredientesQuitados: pedido.ingredientesAQuitar,
          idLinea: (pedido as any).idLinea,
        });
        const dto = await agregarProductoAlCarritoApi(body);
        if (!dto) {
          setMensajeCarrito("No se pudo agregar al carrito");
          return false;
        }
        // Evita que un GET en vuelo (carga inicial) pise el POST recién hecho
        invalidarCargasCarritoPendientes();
        aplicarCarritoDto(dto);
        if (restauranteInfo && idRestaurante) {
          setRestaurante({
            idRestaurante: Number(idRestaurante),
            nombre: restauranteInfo.nombre ?? "",
            abierto: restauranteInfo.abierto ?? true,
            horaApertura: restauranteInfo.horaApertura ?? null,
            horaCierre: restauranteInfo.horaCierre ?? null,
          });
        }
      } catch (err: any) {
        setMensajeCarrito(
          mensajeAmigableApi(err.message ?? "No se pudo agregar al carrito"),
        );
        return false;
      }
    } else {
      const id = producto?.idProducto || (producto as any).id;

      setItems((prev: DTOProductoPedido[]): DTOProductoPedido[] => {
        const idx = prev.findIndex((item) => {
          const mismoId =
            (item.producto?.idProducto || (item.producto as any)?.id) === id;
          const mismasNotas =
            (item.observaciones ?? "") === (pedido.observaciones ?? "");
          const mismosIngredientes = sonMismosIngredientes(
            item.ingredientesAQuitar,
            pedido.ingredientesAQuitar,
          );
          return mismoId && mismasNotas && mismosIngredientes;
        });

        if (idx >= 0) {
          return prev.map((item, index) =>
            index === idx
              ? {
                  ...item,
                  cantidad: (item.cantidad ?? 0) + (pedido.cantidad ?? 1),
                }
              : item,
          );
        }

        return [
          ...prev,
          {
            producto: structuredClone(producto) as DTOProducto,
            cantidad: pedido.cantidad ?? 1,
            observaciones: pedido.observaciones ?? "",
            ingredientesAQuitar: pedido.ingredientesAQuitar ?? [],
          },
        ];
      });

      if (idRestaurante) {
        setRestaurante((prev) => ({
          ...prev,
          idRestaurante,
          nombre: restauranteInfo?.nombre ?? "Restaurante",
          abierto: restauranteInfo?.abierto ?? true,
        }));
      }
    }

    setMensajeCarrito(() => null);
    return true;
  }

  async function eliminarProducto(index: number) {
    const item = items[index];
    if (!item) return;

    if (tieneSesion()) {
      invalidarCargasCarritoPendientes();
      try {
        const idProducto =
          item.producto?.idProducto ?? (item.producto as any)?.id ?? 0;
        const dto = await eliminarProductoDelCarrito(
          idProducto,
          item.producto,
          item.idLinea,
        );
        aplicarCarritoDto(dto);
      } catch (err: any) {
        setMensajeCarrito(err.message ?? "No se pudo eliminar el producto");
      }
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function cambiarCantidad(index: number, nuevaCantidad: number) {
    const cantidad = Math.max(0, Number(nuevaCantidad) || 0);
    const item = items[index];
    if (!item?.producto) return;

    // 1. ACTUALIZACIÓN OPTIMISTA: Cambiamos la UI instantáneamente para ambos casos (con y sin sesión)
    setItems((prev) =>
      prev
        .map((it, i) => (i === index ? { ...it, cantidad } : it))
        .filter((it) => (it.cantidad ?? 0) > 0), // Solucionado el bug que vaciaba todo el carrito
    );

    // 2. Si tiene sesión, se comunica con el servidor en SEGUNDO PLANO
    if (tieneSesion()) {
      invalidarCargasCarritoPendientes();
      try {
        await modificarProductoEnCarrito(
          armarProductoPedidoRequest({
            producto: item.producto,
            cantidad,
            comentarios: item.observaciones ?? "",
            idRestaurante:
              item.producto?.idRestaurante ?? restaurante?.idRestaurante,
            ingredientesQuitados: item.ingredientesAQuitar ?? [],
            idLinea: item.idLinea,
          }),
        );
        await cargarCarritoDesdeApi(true);
      } catch (err: any) {
        setMensajeCarrito(err.message ?? "No se pudo actualizar la cantidad");
        await cargarCarritoDesdeApi(true);
      }
    }
  }

  async function cambiarComentarios(index: number, comentarios: string) {
    const item = items[index];
    if (!item) return;

    if (tieneSesion()) {
      // Actualización optimista
      setItems((prev) =>
        prev.map((it, i) =>
          i === index ? { ...it, observaciones: comentarios ?? "" } : it,
        ),
      );
      if (!item.producto) return;
      invalidarCargasCarritoPendientes();
      try {
        await modificarProductoEnCarrito(
          armarProductoPedidoRequest({
            producto: item.producto,
            cantidad: item.cantidad ?? 1,
            comentarios,
            idRestaurante:
              item.producto?.idRestaurante ?? restaurante?.idRestaurante,
            ingredientesQuitados: item.ingredientesAQuitar ?? [],
            idLinea: item.idLinea,
          }),
        );
        await cargarCarritoDesdeApi(true);
      } catch (err: any) {
        setMensajeCarrito(err.message ?? "No se pudo guardar el comentario");
        await cargarCarritoDesdeApi(true);
      }
    } else {
      // Sin sesión: al editar la nota la línea puede quedar igual a otra; consolidar.
      setItems((prev) =>
        consolidarItems(
          prev.map((it, i) =>
            i === index ? { ...it, observaciones: comentarios ?? "" } : it,
          ),
        ),
      );
    }
  }

  async function cambiarIngredientesQuitados(
    index: number,
    ingredientesQuitados: DTOIngrediente[],
  ) {
    const lista = ingredientesQuitados ?? [];
    const item = items[index];
    if (!item) return;

    if (tieneSesion()) {
      // Actualización optimista
      setItems((prev) =>
        prev.map((it, i) =>
          i === index ? { ...it, ingredientesAQuitar: lista } : it,
        ),
      );
      if (!item.producto) return;
      invalidarCargasCarritoPendientes();
      try {
        await modificarProductoEnCarrito(
          armarProductoPedidoRequest({
            producto: item.producto,
            cantidad: item.cantidad ?? 1,
            comentarios: item.observaciones ?? "",
            idRestaurante:
              item.producto?.idRestaurante ?? restaurante?.idRestaurante,
            ingredientesQuitados: lista,
            idLinea: item.idLinea,
          }),
        );
        await cargarCarritoDesdeApi(true);
      } catch (err: any) {
        setMensajeCarrito(
          err.message ?? "No se pudieron actualizar los ingredientes",
        );
        await cargarCarritoDesdeApi(true);
      }
    } else {
      // Sin sesión: si la línea editada queda igual a otra, consolidarlas.
      setItems((prev) =>
        consolidarItems(
          prev.map((it, i) =>
            i === index ? { ...it, ingredientesAQuitar: lista } : it,
          ),
        ),
      );
    }
  }

  function direccionParaBackend(): any {
    if (!direccionSeleccionada) return null;
    if (direccionSeleccionada.tipo === "guardada") {
      return direccionSeleccionada.data;
    }
    if (direccionSeleccionada.data) {
      return direccionSeleccionada.data;
    }
    const { latitud, longitud } = direccionSeleccionada.data ?? {};
    return {
      calle: "Ubicación actual",
      numero: "0",
      apartamento: "0",
      esquina: "",
      latitud: latitud ?? 0,
      longitud: longitud ?? 0,
    };
  }

  async function confirmarPedidoYpagar() {
    if (!tieneSesion()) {
      throw new Error("Tenés que iniciar sesión para realizar el pedido.");
    }
    if (!carritoDto || items.length === 0) {
      throw new Error("El carrito está vacío.");
    }
    const direccion = direccionParaBackend();
    if (!direccion) {
      throw new Error("Seleccioná una dirección de envío.");
    }

    const preferencia = await confirmarPedido({
      carrito: carritoDto,
      direccion,
      restauranteId: restaurante?.idRestaurante ?? carritoDto.idRestaurante,
    });

    return preferencia;
  }

  const validarRestauranteAbierto = useCallback(
    (estadoAbierto?: boolean) => {
      if (typeof estadoAbierto === "boolean") {
        setRestaurante((prev) => {
          if (!prev) return prev;
          if (prev.abierto === estadoAbierto) return prev;
          return { ...prev, abierto: estadoAbierto };
        });
        return estadoAbierto;
      }
      return restaurante?.abierto ?? true;
    },
    [restaurante?.abierto],
  );

  const value: CarritoContextType = {
    items,
    carritoDto,
    total,
    cantidadTotal,
    restaurante,
    carritoAbierto,
    productoEnDetalle,
    restauranteDelDetalle,
    direccionModalAbierto,
    direcciones,
    direccionSeleccionada,
    pagoModalAbierto,
    mensajeCarrito,
    modalSuperior,
    cargandoCarrito,
    usarApi,
    restauranteAbierto, 

    abrirCarrito,
    cerrarCarrito,
    abrirDetalleProducto,
    cerrarDetalleProducto,
    abrirModalDireccion,
    cerrarModalDireccion,
    abrirModalPago,
    cerrarModalPago,
    setDireccionSeleccionada,
    setMensajeCarrito,
    vaciarCarrito,
    agregarProductoAlCarrito,
    eliminarProducto,
    cambiarCantidad,
    cambiarComentarios,
    cambiarIngredientesQuitados,
    validarRestauranteAbierto,
    cargarCarritoDesdeApi,
    cargarDireccionesDesdeApi,
    confirmarPedidoYpagar,
  };

  return (
    <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCarrito(): CarritoContextType {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  return ctx;
}

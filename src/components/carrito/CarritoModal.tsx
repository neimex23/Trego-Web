import React, { useEffect, useMemo, useState } from "react";
import ModalBase, { Z_MODAL } from "./ModalBase.jsx";
import {
  esLabelSoloCoordenadas,
  resolverDireccionDesdeCoords,
} from "../../api/mapeadores.js";
import { useCarrito } from "../../context/CarritoContext.js";
import type { DTOIngrediente } from "../../data/DTOIngrediente.js";
import type { DTOProducto } from "../../data/DTOProducto.js";
import type { DTOProductoPedido } from "../../data/DTOProductoPedido.js";
import { EnumTipoProducto } from "../../data/EnumTipoProducto.js";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DetalleCombo } from "./DetalleCombo.js";
import { obtenerPrecios } from "../../utils/productos.js";

interface IngredientesEditorProps {
  producto: DTOProducto;
  ingredientesQuitados?: DTOIngrediente[];
  onChange: (val: DTOIngrediente[]) => void;
}

function obtenerNombresIngredientes(producto: DTOProducto): string[] {
  if (!producto.ingredientes?.length) return [];
  return producto.ingredientes
    .map((i) => (typeof i === "string" ? i : i.nombre))
    .filter((nombre): nombre is string => Boolean(nombre));
}

function IngredientesEditor({
  producto,
  ingredientesQuitados,
  onChange,
}: IngredientesEditorProps): React.JSX.Element | null {
  const todos = useMemo(() => obtenerNombresIngredientes(producto), [producto]);
  const quitados = ingredientesQuitados ?? [];
  const quitadosNombres = useMemo(
    () => new Set(quitados.map((i) => i.nombre).filter(Boolean)),
    [quitados],
  );

  if (!todos.length) return null;

  function toggle(nombre: string): void {
    if (quitadosNombres.has(nombre)) {
      onChange(quitados.filter((q) => q.nombre !== nombre));
      return;
    }

    const delCatalogo = (producto.ingredientes ?? []).find(
      (i) => typeof i !== "string" && i.nombre === nombre,
    ) as DTOIngrediente | undefined;
    const idRestaurante =
      producto.idRestaurante ??
      delCatalogo?.idRestaurante ??
      quitados[0]?.idRestaurante ??
      0;

    const nuevo: DTOIngrediente = {
      idIngrediente: delCatalogo?.idIngrediente ?? 0,
      nombre,
      idRestaurante,
    };
    onChange([...quitados, nuevo]);
  }

  return (
    <div className="mt-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
        Ingredientes
      </p>
      <p className="mt-0.5 text-[10px] text-gray-400">
        Tocá para quitar del plato
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {todos.map((ing) => {
          const quitado = quitadosNombres.has(ing);
          return (
            <button
              key={ing}
              type="button"
              onClick={() => toggle(ing)}
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors ${
                quitado
                  ? "bg-gray-100 text-gray-400 line-through"
                  : "bg-orange-50 text-trego-orange hover:bg-orange-100"
              }`}
            >
              {ing}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ItemCarritoProps {
  item: DTOProductoPedido;
  index: number;
  onNota: (index: number, item: DTOProductoPedido) => void;
  onEliminar: (index: number) => void;
  onCambiarCantidad: (index: number, cantidad: number) => void;
  onCambiarIngredientes: (
    index: number,
    ingredientes: DTOIngrediente[],
  ) => void;
}

const CLS = {
  btnNota:
    "rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-gray-500 hover:bg-gray-50 transition-colors",
  btnEliminar:
    "rounded-xl border border-red-100 bg-red-50 px-2.5 py-1.5 text-[11px] font-extrabold text-red-500 hover:bg-red-100 transition-colors",
} as const;

function clsBanner(positivo: boolean): string {
  return `mt-4 rounded-2xl border px-4 py-3 text-[13px] font-bold ${
    positivo
      ? "border-green-200 bg-green-50 text-green-800"
      : "border-orange-100 bg-orange-50 text-orange-800"
  }`;
}

function formatearMoneda(n: number | string | undefined | null): string {
  const num = Number(n) || 0;
  return `${num} $`;
}

function esMensajePositivo(mensaje: string): boolean {
  return mensaje.includes("seleccionad") || mensaje.includes("correctamente");
}

function extraerIdItem(item: DTOProductoPedido): number {
  return item.producto?.idProducto || (item.producto as any)?.id || 0;
}

function ItemCarrito({
  item,
  index,
  onNota,
  onEliminar,
  onCambiarCantidad,
  onCambiarIngredientes,
}: ItemCarritoProps): React.JSX.Element {
  const cantidad = item.cantidad || 1;
  const { conDescuento } = obtenerPrecios(item.producto ?? {});

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex gap-3">
        <img
          src={item.producto?.urlImagen}
          alt={item.producto?.nombre}
          className="h-16 w-16 shrink-0 rounded-xl bg-gray-100 object-cover sm:h-[72px] sm:w-[72px]"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <p className="line-clamp-2 text-[14px] font-extrabold leading-snug text-gray-900">
              {item.producto?.nombre}
            </p>
            <div className="flex shrink-0 items-center gap-1 self-start">
              <button
                type="button"
                onClick={() => onNota(index, item)}
                className={CLS.btnNota}
                title="Agregar nota al producto"
              >
                Nota
              </button>
              <button
                type="button"
                onClick={() => onEliminar(index)}
                className={CLS.btnEliminar}
                title="Eliminar producto"
              >
                Eliminar
              </button>
            </div>
          </div>

          <p className="mt-1 text-[12px] text-gray-400">
            Precio unidad:{" "}
            <span className="font-extrabold text-gray-700">
              {formatearMoneda(conDescuento)}
            </span>
          </p>

          {item.observaciones?.trim() && (
            <p className="mt-1.5 line-clamp-2 text-[11px] italic text-gray-500">
              Nota: {item.observaciones}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => onCambiarCantidad(index, cantidad - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-trego-add transition-colors hover:bg-orange-100 hover:text-trego-orange active:scale-95"
            aria-label="Disminuir cantidad"
          >
            <ChevronDown size={20} />
          </button>
          <span className="min-w-8 text-center text-[14px] font-extrabold text-gray-900">
            {cantidad}
          </span>
          <button
            type="button"
            onClick={() => onCambiarCantidad(index, cantidad + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-trego-add transition-colors hover:bg-orange-100 hover:text-trego-orange active:scale-95"
            aria-label="Aumentar cantidad"
          >
            <ChevronUp size={20} />
          </button>
        </div>

        <p className="text-[13px] text-gray-500">
          Subtotal:{" "}
          <span className="font-extrabold text-gray-900">
            {formatearMoneda(item.subtotal)}
          </span>
        </p>
      </div>

      {item.producto?.tipo === EnumTipoProducto.Plato && item.producto && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <IngredientesEditor
            producto={item.producto}
            ingredientesQuitados={item.ingredientesAQuitar ?? []}
            onChange={(val) => onCambiarIngredientes(index, val)}
          />
        </div>
      )}

      {item.producto?.tipo === EnumTipoProducto.Combo && item.producto.combo && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <DetalleCombo
            productos={item.producto.combo.productosIncluidos ?? []}
          />
        </div>
      )}
    </article>
  );
}

export default function CarritoModal(): React.JSX.Element {
  const {
    carritoAbierto,
    cerrarCarrito,
    items,
    total,
    direccionSeleccionada,
    setDireccionSeleccionada,
    abrirModalDireccion,
    abrirModalPago,
    eliminarProducto,
    cambiarCantidad,
    cambiarComentarios,
    cambiarIngredientesQuitados,
    vaciarCarrito,
    mensajeCarrito,
    setMensajeCarrito,
    modalSuperior,
    cargandoCarrito,
    restauranteAbierto,
  } = useCarrito();

  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState<string>("");
  const [comentarioTmp, setComentarioTmp] = useState<string>("");

  const carritoVacio = items.length === 0;

  const direccionLabel = useMemo(() => {
    if (!direccionSeleccionada?.data) return "Sin direccion seleccionada";
    const { calle, numero } = direccionSeleccionada.data;
    if (!calle) return "Ubicacion actual";
    return `${calle} ${numero ?? ""}`.trim();
  }, [direccionSeleccionada]);

  useEffect(() => {
    const data = direccionSeleccionada?.data;

    if (!carritoAbierto || !data?.latitud || !data?.longitud) return;
    if (direccionSeleccionada?.tipo !== "actual") return;

    const tieneCalleValida = data.calle && !esLabelSoloCoordenadas(data.calle);
    if (tieneCalleValida) return;

    let cancelado = false;
    const cords = { latitud: data.latitud, longitud: data.longitud };

    resolverDireccionDesdeCoords(cords).then((resuelta: any) => {
      if (cancelado) return;

      setDireccionSeleccionada((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tipo: resuelta.nombre || "actual",
          data: {
            ...prev.data,
            ...resuelta.datos,
          },
        };
      });
    });

    return () => {
      cancelado = true;
    };
  }, [carritoAbierto, direccionSeleccionada, setDireccionSeleccionada]);

  function cerrar(): void {
    setMensajeCarrito(null);
    cancelarEdicion();
    cerrarCarrito();
  }

  function intentarPagar(): void {
    if (!restauranteAbierto) {
      setMensajeCarrito(
        "El Restaurante esta cerrado y no se encuentra disponible para recibir pedidos.",
      );
      vaciarCarrito();
      return;
    }
    abrirModalPago();
  }

  function realizarPedido(): void {
    if (carritoVacio) return;
    if (!direccionSeleccionada) {
      abrirModalDireccion();
      return;
    }
    intentarPagar();
  }

  function abrirEditorComentario(index: number, item: DTOProductoPedido): void {
    setEditandoIndex(index);
    setEditandoNombre(item.producto?.nombre ?? "Producto");
    setComentarioTmp(item.observaciones ?? "");
  }

  function guardarComentario(): void {
    if (editandoIndex === null) return;
    cambiarComentarios(editandoIndex, comentarioTmp);
    cancelarEdicion();
  }
  
  function cancelarEdicion(): void {
    setEditandoIndex(null);
    setEditandoNombre("");
    setComentarioTmp("");
  }

  function cambiarCantidadItem(index: number, x: number): void {
    cambiarCantidad(index, x);
    if (x <= 0) cancelarEdicion();
  }

  return (
    <ModalBase
      abierto={carritoAbierto}
      onCerrar={cerrar}
      ariaLabel="Carrito"
      className="flex max-h-[92vh] max-w-160 flex-col overflow-hidden sm:max-h-[90vh]"
      zIndex={Z_MODAL?.carrito ?? 50}
      escucharEscape={modalSuperior === "carrito"}
    >
      <div className="flex min-h-0 flex-col overflow-hidden p-3 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-extrabold text-gray-900">Carrito</h2>
          <button
            type="button"
            onClick={cerrar}
            className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-bold text-gray-500 transition-colors hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>

        {mensajeCarrito && (
          <div
            className={`${clsBanner(esMensajePositivo(mensajeCarrito))} mt-2`}
          >
            {mensajeCarrito}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-orange-100 bg-orange-50/60 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e85d04"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-orange-400">
                Entrega en
              </p>
              <p
                className="line-clamp-2 text-[13px] font-extrabold leading-snug text-gray-900 sm:truncate sm:line-clamp-1"
                title={direccionLabel}
              >
                {direccionLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={abrirModalDireccion}
            className="w-full shrink-0 rounded-full border border-orange-200 bg-white px-3 py-2 text-[11px] font-extrabold text-orange-600 transition-colors hover:bg-orange-50 sm:w-auto sm:py-1.5"
          >
            Cambiar
          </button>
        </div>

        <div className="custom-scrollbar mt-3 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5 sm:pr-1">
          {cargandoCarrito ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-trego-orange" />
              <p className="text-[13px] text-gray-400">Cargando carrito...</p>
            </div>
          ) : carritoVacio ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
              <p className="text-[13px] font-bold text-gray-400">
                No hay productos en el carrito
              </p>
              <p className="mt-1 text-[12px] text-gray-300">
                Agrega algo para comenzar!
              </p>
            </div>
          ) : (
            items.map((item: DTOProductoPedido, index) => (
              <ItemCarrito
                key={`${item.idLinea ?? extraerIdItem(item)}-${index}-${item.observaciones ?? ""}`}
                item={item}
                index={index}
                onNota={abrirEditorComentario}
                onEliminar={eliminarProducto}
                onCambiarCantidad={cambiarCantidadItem}
                onCambiarIngredientes={cambiarIngredientesQuitados}
              />
            ))
          )}
        </div>

        {!carritoVacio &&
          (editandoIndex !== null ? (
            <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[12px] font-extrabold text-gray-600">
                  Nota para
                </p>
                <span className="max-w-50 truncate rounded-xl bg-gray-100 px-3 py-1 text-[12px] font-extrabold text-gray-800">
                  {editandoNombre}
                </span>
              </div>
              <textarea
                value={comentarioTmp}
                onChange={(e) => setComentarioTmp(e.target.value)}
                placeholder="Ej: sin sal, sin cebolla..."
                rows={2}
                className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-[#fafafa] p-3 text-[13px] outline-none focus:border-trego-orange transition-colors"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-extrabold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarComentario}
                  className="flex-1 rounded-full bg-trego-orange px-4 py-2.5 text-[13px] font-extrabold text-white shadow-sm hover:bg-orange-600 active:scale-[0.99] transition-colors"
                >
                  Guardar nota
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 shrink-0 rounded-2xl border border-orange-100 bg-[#fff8f4] px-3 pb-3 pt-2 sm:mt-4 sm:px-4 sm:pb-4">
              <div className="flex items-center justify-between pb-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-orange-400">
                  Total del pedido
                </p>
                <p className="text-[18px] font-extrabold text-gray-900 sm:text-[20px]">
                  {formatearMoneda(total)}
                </p>
              </div>
              <button
                type="button"
                onClick={realizarPedido}
                disabled={carritoVacio}
                className="w-full rounded-full bg-trego-orange py-3 text-[13px] font-extrabold text-white shadow-sm transition-colors hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50"
              >
                {direccionSeleccionada ? "Realizar pago" : "Realizar pedido"}
              </button>
            </div>
          ))}
      </div>
    </ModalBase>
  );
}

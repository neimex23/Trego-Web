import React, { useState, useEffect, useMemo } from "react";
import type { DTOProducto } from "../../data/DTOProducto.js";
import type { DTOIngrediente } from "../../data/DTOIngrediente.js";
import ModalBase, { Z_MODAL } from "./ModalBase.jsx";
import { useCarrito } from "../../context/CarritoContext.js";
import type { DTOProductoPedido } from "../../data/DTOProductoPedido.js";
import { EnumTipoProducto } from "../../data/EnumTipoProducto.js";
import { DetalleCombo } from "./DetalleCombo.js";
import { obtenerPrecios } from "../../utils/productos.js";
import { obtenerThumbnail } from "../../pages/restaurantes/utilitis/cloudinaryUtilitis.js";

function obtenerIngredientes(producto: DTOProducto | null): string[] {
  if (producto?.ingredientes?.length) {
    return producto.ingredientes
      .map((i) => (typeof i === "string" ? i : i.nombre))
      .filter((nombre): nombre is string => Boolean(nombre));
  }
  return [];
}

export default function DetalleProductoModal(): React.JSX.Element {
  const {
    productoEnDetalle,
    restauranteDelDetalle,
    cerrarDetalleProducto,
    agregarProductoAlCarrito,
    modalSuperior,
    mensajeCarrito,
    setMensajeCarrito,
  } = useCarrito();

  const abierto = !!productoEnDetalle;
  const producto = productoEnDetalle;
  const { conDescuento } = obtenerPrecios(producto ?? {});

  const [cantidad, setCantidad] = useState<number>(1);
  const [comentarios, setComentarios] = useState<string>("");
  const [quitados, setQuitados] = useState<string[]>([]);
  const [agregando, setAgregando] = useState(false);

  const ingredientes = useMemo(() => obtenerIngredientes(producto), [producto]);
  const mostrarIngredientes =
    producto?.tipo === EnumTipoProducto.Plato || ingredientes.length > 0;

  useEffect(() => {
    setQuitados([]);
    setCantidad(1);
    setComentarios("");
    setAgregando(false);
    setMensajeCarrito(null);
  }, [producto?.idProducto, setMensajeCarrito]);

  function toggleQuitado(nombre: string): void {
    setQuitados((prev) =>
      prev.includes(nombre)
        ? prev.filter((x) => x !== nombre)
        : [...prev, nombre],
    );
  }

  function cerrar(): void {
    setCantidad(1);
    setComentarios("");
    setQuitados([]);
    cerrarDetalleProducto();
  }

  async function agregar(): Promise<void> {
    if (!producto || agregando) return;

    const idRestauranteActual =
      producto.idRestaurante ||
      restauranteDelDetalle?.idRestaurante ||
      0;

    const ingredientesObjetos: DTOIngrediente[] = quitados.map((nombre) => ({
      nombre,
      idRestaurante: idRestauranteActual,
    }));

    const productoPedido: DTOProductoPedido = {
      cantidad,
      ingredientesAQuitar: ingredientesObjetos,
      observaciones: comentarios,
      producto,
    };

    setAgregando(true);
    setMensajeCarrito(null);
    try {
      const ok = await agregarProductoAlCarrito(
        productoPedido,
        restauranteDelDetalle,
      );
      if (ok) cerrar();
    } finally {
      setAgregando(false);
    }
  }

  return (
    <ModalBase
      abierto={abierto}
      onCerrar={cerrar}
      ariaLabel="Detalle del producto"
      zIndex={Z_MODAL.detalle}
      escucharEscape={modalSuperior === "detalle"}
    >
      <div className="p-5 sm:p-6 relative">
        <div className="flex gap-4 items-start justify-between">
          <div className="flex gap-4 items-start min-w-0 flex-1">
            <img
              src={obtenerThumbnail(producto?.urlImagen ?? "")}
              alt={producto?.nombre || "Producto"}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover bg-gray-100 shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-[18px] font-extrabold text-gray-900 leading-tight">
                {producto?.nombre}
              </h2>
              <p className="mt-1 text-[13px] text-gray-500 line-clamp-2 sm:line-clamp-none">
                {producto?.descripcion}
              </p>
              <p className="mt-2 text-[18px] font-extrabold text-trego-brown">
                ${conDescuento}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cerrar}
            className="rounded-full bg-gray-50 px-3 py-1.5 text-[12px] font-bold text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-[#f9f9f9] p-4">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-[13px] font-extrabold text-gray-800">
                Cantidad
              </span>
              <div className="flex items-center gap-3 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                <button
                  type="button"
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  className="h-8 w-8 rounded-full bg-gray-50 text-[16px] font-black text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  -
                </button>
                <div className="min-w-8 text-center text-[15px] font-extrabold text-gray-900">
                  {cantidad}
                </div>
                <button
                  type="button"
                  onClick={() => setCantidad((c) => c + 1)}
                  className="h-8 w-8 rounded-full bg-gray-50 text-[16px] font-black text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-gray-200/60 pt-3 sm:pt-0">
              <span className="text-[13px] text-gray-500 font-bold sm:block">
                Subtotal
              </span>
              <p className="text-[18px] font-extrabold text-gray-900">
                ${conDescuento * cantidad}
              </p>
            </div>
          </div>

          {mostrarIngredientes && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-[12px] font-extrabold text-gray-800 uppercase tracking-wide">
                Ingredientes
              </p>
              {ingredientes.length === 0 ? (
                <p className="mt-2 text-[12px] text-gray-400">
                  Este producto no tiene ingredientes configurados.
                </p>
              ) : (
                <p className="mt-1 text-[12px] text-gray-400">
                  Tocá los que no querés en tu plato.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {ingredientes.map((ing) => {
                  const quitado = quitados.includes(ing);
                  return (
                    <button
                      type="button"
                      key={ing}
                      onClick={() => toggleQuitado(ing)}
                      className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-all duration-200 ${
                        quitado
                          ? "bg-gray-100 text-gray-400 line-through scale-[0.97]"
                          : "bg-trego-orange/10 text-trego-orange hover:bg-trego-orange/20"
                      }`}
                    >
                      {ing}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {producto?.tipo === EnumTipoProducto.Combo && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-[12px] font-extrabold text-gray-800 uppercase tracking-wide">
                Este combo incluye
              </p>
              {producto?.combo?.productosIncluidos?.length === 0 ? (
                <p className="mt-2 text-[12px] text-gray-400">
                  Este combo no tiene productos.
                </p>
              ) : undefined}
              <div className="mt-3 flex flex-wrap gap-2">
                {producto?.combo?.productosIncluidos && (
                  <DetalleCombo
                    productos={producto.combo.productosIncluidos}
                    className="text-sm! px-4 "
                  />
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-[12px] font-extrabold text-gray-800 uppercase tracking-wide">
              Comentarios{" "}
              <span className="text-gray-400 font-normal normal-case">
                (opcional)
              </span>
            </p>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Ej: sin sal, bien cocido, etc."
              rows={2}
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-[#fafafa] p-3 text-[13px] outline-none focus:border-trego-orange focus:bg-white transition-colors"
            />
          </div>
        </div>

        {mensajeCarrito && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
            {mensajeCarrito}
          </p>
        )}

        <div className="mt-5">
          <button
            type="button"
            disabled={agregando}
            onClick={() => void agregar()}
            className="w-full rounded-full bg-trego-orange py-3.5 text-[14px] font-extrabold text-white shadow-md hover:bg-orange-600 active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            {agregando ? "Agregando…" : "Agregar al Carrito"}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}

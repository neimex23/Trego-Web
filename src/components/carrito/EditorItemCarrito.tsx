import { useEffect, useMemo, useState } from "react";
import type { DTOProductoPedido } from "../../data/DTOProductoPedido.js";
import type { DTOIngrediente } from "../../data/DTOIngrediente.js";
import { obtenerPrecios, precioConDescuento } from "../../utils/productos.js";

function formatearMoneda(n: number) {
  return `${Number(n) || 0}$`;
}

interface EditorItemCarritoProps {
  item?: DTOProductoPedido;
  onSave: (item: DTOProductoPedido) => void;
  onCancel?: () => void;
  guardando?: boolean;
}
export default function EditorItemCarrito({
  item,
  onSave,
  onCancel,
  guardando = false,
}: EditorItemCarritoProps) {
  const [cantidad, setCantidad] = useState<number>(item?.cantidad ?? 1);
  const [comentarios, setComentarios] = useState<string>(
    item?.observaciones ?? "",
  );
  const [quitados, setQuitados] = useState<DTOIngrediente[]>(
    item?.ingredientesAQuitar ?? [],
  );
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const { conDescuento } = obtenerPrecios(item?.producto ?? {});
  const ingredientesProducto = item?.producto?.ingredientes ?? [];

  useEffect(() => {
    setCantidad(item?.cantidad ?? 1);
    setComentarios(item?.observaciones ?? "");
    setQuitados(item?.ingredientesAQuitar ?? []);
    setErrorGuardar(null);
  }, [item?.producto?.idProducto]);

  function toggleQuitado(ing: DTOIngrediente) {
    setQuitados((prev) => {
      const yaEstaQuitado = prev.some(
        (q) => q.idIngrediente === ing.idIngrediente,
      );

      // Si ya está en la lista de quitados, lo removemos (lo volvemos a agregar al plato)
      if (yaEstaQuitado) {
        return prev.filter((q) => q.idIngrediente !== ing.idIngrediente);
      }

      // Si no está, lo agregamos a la lista de quitados
      return [...prev, ing];
    });
  }

  function guardar() {
    try {
      const result: DTOProductoPedido = {
        cantidad: cantidad,
        ingredientesAQuitar: quitados,
        observaciones: comentarios,
      };
      onSave(result);
    } catch (err) {
      setErrorGuardar(
        err instanceof Error ? err.message : "No se pudo guardar los cambios",
      );
    }
  }

  if (!item) return null;

  return (
    <div className="rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {item.producto && (
          <img
            src={item.producto.urlImagen}
            alt={item.producto.nombre}
            className="h-14 w-14 shrink-0 rounded-xl object-cover bg-gray-200"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-extrabold text-gray-800">
            Editar producto
          </p>
          <p className="truncate text-[13px] font-bold text-gray-900">
            {item.producto?.nombre}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-gray-200 bg-[#f5f5f5] p-3">
          <p className="text-[11px] font-extrabold text-gray-800">Cantidad</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              disabled={guardando}
              className="h-9 w-9 rounded-full border border-gray-200 bg-white text-[16px] font-black text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              -
            </button>
            <div className="min-w-10 text-center text-[16px] font-extrabold text-gray-900">
              {cantidad}
            </div>
            <button
              type="button"
              onClick={() => setCantidad((c) => c + 1)}
              disabled={guardando}
              className="h-9 w-9 rounded-full border border-gray-200 bg-white text-[16px] font-black text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-[11px] font-extrabold text-gray-800">
            Ingredientes
          </p>
          {ingredientesProducto.length === 0 ? (
            <p className="mt-1 text-[11px] text-gray-500">
              Este producto no tiene ingredientes configurados.
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-gray-500">
              Tocá los ingredientes que querés sacar.
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {ingredientesProducto.map((ing) => {
              const quitado = quitados.some(
                (q) => q.idIngrediente === ing.idIngrediente,
              );
              return (
                <button
                  type="button"
                  key={ing.idIngrediente}
                  onClick={() => toggleQuitado(ing)}
                  disabled={guardando}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold transition disabled:opacity-50 ${
                    quitado
                      ? "bg-gray-200 text-gray-500 line-through"
                      : "bg-trego-orange/10 text-trego-orange hover:bg-trego-orange/15"
                  }`}
                >
                  {ing.nombre}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-[11px] font-extrabold text-gray-800">
            Comentarios (opcional)
          </p>
          <textarea
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            placeholder="Ej: sin sal, bien cocido..."
            rows={2}
            disabled={guardando}
            className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-[#fafafa] p-3 text-[12px] outline-none focus:border-trego-orange disabled:opacity-60"
          />
        </div>
      </div>

      {errorGuardar && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] font-bold text-red-700">
          {errorGuardar}
        </p>
      )}

      <p className="mt-3 text-[12px] text-gray-500">
        Subtotal:{" "}
        <span className="font-extrabold text-gray-900">
          {formatearMoneda(conDescuento * cantidad)}
        </span>
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={guardando}
          className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[12px] font-extrabold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="flex-1 rounded-full bg-trego-orange px-4 py-2.5 text-[12px] font-extrabold text-white shadow-md hover:bg-orange-600 disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

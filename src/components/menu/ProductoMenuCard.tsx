import type { DTOProducto } from "../../data/DTOProducto.js";
import { EnumTipoProducto } from "../../data/EnumTipoProducto.js";
import { obtenerThumbnail } from "../../pages/restaurantes/utilitis/cloudinaryUtilitis.js";
import { obtenerPrecios } from "../../utils/productos.js";
import { DetalleCombo } from "../carrito/DetalleCombo.js";
import { IconPlus } from "../icons.jsx";

interface ProductoMenuCardProps {
  producto: DTOProducto;
  onAgregar?: (producto: DTOProducto) => void;
}

export default function ProductoMenuCard({
  producto,
  onAgregar,
}: ProductoMenuCardProps) {
  const { nombre, descripcion, urlImagen } = producto;
  const { tieneOferta, conDescuento, original } = obtenerPrecios(producto);

  return (
    <article className="flex items-center gap-4 rounded-2xl border border-gray-200 shadow bg-gray-50 p-3 sm:p-4">
      <img
        src={obtenerThumbnail(urlImagen ?? "")}
        alt={nombre}
        className="h-18 w-18 shrink-0 rounded-xl object-cover bg-gray-50 sm:h-20 sm:w-20"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-bold text-gray-900">{nombre}</h3>
        {producto.tipo === EnumTipoProducto.Combo ? (
          producto.combo && (
            <div className="flex gap-2">
              <p className="my-auto text-[12px] text-gray-600">Incluye:</p>
              <DetalleCombo
                productos={producto.combo.productosIncluidos ?? []}
              />
            </div>
          )
        ) : (
          <p className="mt-1 line-clamp-2 text-[12px] text-gray-600">
            {descripcion}
          </p>
        )}

        <p className="mt-2 flex items-baseline gap-2">
          {tieneOferta ? (
            <>
              <span className="text-[16px] font-bold text-red-700">
                {conDescuento}$
              </span>
              <span className="text-[16px] font-semibold text-gray-500 line-through">
                {original}$
              </span>
            </>
          ) : (
            <>
              <span className="text-[14px] text-gray-600 ">Precio: </span>
              <span className="text-[16px] font-bold text-red-700">
                {original}$
              </span>
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onAgregar?.(producto)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-trego-add text-white shadow-md transition hover:opacity-90"
        aria-label={`Agregar ${nombre}`}
      >
        <IconPlus className="h-5 w-5" />
      </button>
    </article>
  );
}

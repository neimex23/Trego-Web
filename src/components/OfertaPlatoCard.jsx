import { IconStar } from "./icons";
import { obtenerPrecios } from "../utils/productos.js";
import { obtenerBannerOferta } from "../pages/restaurantes/utilitis/cloudinaryUtilitis.js";

const cardBase =
  "block shrink-0 overflow-hidden rounded-[18px] bg-gray-50 border-gray-300 shadow text-left transition hover:shadow-[0_3px_12px_rgba(0,0,0,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-trego-orange";

function formatearPrecio(n) {
  return `$ ${Number(n).toLocaleString("es-UY", { maximumFractionDigits: 0 })}`;
}

export default function OfertaPlatoCard({
  oferta,
  enGrid = false,
  onSeleccionar,
}) {
  const producto = oferta.producto ?? {};
  const { conDescuento, original, tieneOferta } = obtenerPrecios(producto);

  const sizeClass = enGrid
    ? "w-full max-w-[220px] mx-auto"
    : "w-[calc((100%-0.75rem)/2)] min-w-[136px] max-w-[172px] shrink-0 snap-start sm:w-[172px]";

  const imgClass = enGrid
    ? "relative aspect-square shrink-0 bg-gray-50"
    : "relative aspect-square shrink-0 bg-[#d4d4d9]";

  const imagen =
    producto.oferta?.urlImagen ??
    producto.fotoPlato ??
    producto.urlImagen ??
    null;
  const descuento =
    producto.oferta?.descuento ?? producto.oferta?.descuentoPorcentaje;

  return (
    <button
      type="button"
      onClick={() => onSeleccionar?.(oferta)}
      className={`${cardBase} ${sizeClass} flex flex-col cursor-pointer`}
    >
      {/* Imagen */}
      <div className={imgClass}>
        {imagen ? (
          <img
            src={obtenerBannerOferta(imagen)}
            alt="Imagen oferta"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-500"
            aria-hidden
          >
            {producto.nombre?.slice(0, 2)?.toUpperCase() ?? "—"}
          </div>
        )}
        {descuento > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-trego-orange px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            -{Math.round(descuento)}%
          </span>
        )}
      </div>

      {/* Contenido */}
      <article className="flex flex-1 flex-col justify-between gap-1.5 p-2.5">
        <div className="min-h-0">
          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-900">
            {producto.nombre ?? "Plato en oferta"}
          </h3>
          <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-gray-600">
            <span className="truncate">
              {oferta.nombreRestaurante ?? "Restaurante"}
            </span>
            <span className="shrink-0 text-gray-300">·</span>
            <span className="inline-flex shrink-0 items-center gap-0.5 font-medium text-gray-700">
              <IconStar className="h-3 w-3 text-amber-400" />
              {(oferta.calificacionProm ?? 0).toFixed(1)}
            </span>
          </p>
        </div>

        <p className="text-[12px] leading-tight">
          {tieneOferta ? (
            <>
              <span className="font-bold text-trego-orange">
                {formatearPrecio(conDescuento)}
              </span>
              <span className="ml-1 text-[11px] text-gray-400 line-through">
                {formatearPrecio(original)}
              </span>
            </>
          ) : (
            <span className="font-semibold text-gray-900">
              {formatearPrecio(conDescuento)}
            </span>
          )}
        </p>
      </article>
    </button>
  );
}

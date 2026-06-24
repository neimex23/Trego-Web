import type { DTOProducto } from "../../../data/DTOProducto.js";
import { EnumTipoProducto } from "../../../data/EnumTipoProducto.js";
import { obtenerThumbnail } from "../utilitis/cloudinaryUtilitis.js";

const TIPO_STYLES = {
  Plato: {
    pill: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "#f59e0b",
  },
  Articulo: {
    pill: "bg-pink-50 text-pink-800 border-pink-200",
    dot: "#f472b6",
  },
  Combo: {
    pill: "bg-violet-50 text-violet-800 border-violet-200",
    dot: "#a78bfa",
  },
};
const TIPO_DEFAULT = {
  pill: "bg-gray-100 text-gray-600 border-gray-200",
  dot: "#9ca3af",
};

function ImagePlaceholder() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#d1d5db"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
interface ProductoCardPropd {
  producto: DTOProducto;
  onClick: () => void;
}

export default function ProductoCard({ producto, onClick }: ProductoCardPropd) {
  const ingredientes = (producto.ingredientes ?? [])
    .map((i) => (typeof i === "string" ? i : i.nombre))
    .filter(Boolean);

  const esPlato = producto.tipo === EnumTipoProducto.Plato;
  const tipoStyle = TIPO_STYLES[producto.tipo ?? EnumTipoProducto.Articulo] || TIPO_DEFAULT;
  const noDisponible = producto.disponible === false;

  return (
    <div
      onClick={onClick}
      className={`
    flex flex-col sm:flex-row gap-3 p-2.5 min-h-28 rounded-[14px] overflow-hidden relative
    transition-all duration-180 ease-in-out
    border shadow-[0_1px_3px_rgba(0,0,0,0.02)] 
    ${
      noDisponible
        ? "bg-gray-50 opacity-[0.55] grayscale-40 cursor-default border-gray-500"
        : "bg-white cursor-pointer border-gray-400 hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.10),0_2px_6px_-2px_rgba(0,0,0,0.06)]"
    }
  `}
    >
      {/* Imagen */}
      <div
        className="
      w-23 h-23 shrink-0 self-center
      rounded-[10px] bg-gray-100 border border-[#f0f0ef]
      flex items-center justify-center overflow-hidden
    "
      >
        {producto.urlImagen ? (
          <img
            src={obtenerThumbnail(producto?.urlImagen)}
            alt={producto.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0 flex flex-col justify-between pt-0.5 pb-1">
        {/* Fila 1: Nombre + Precio */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="m-0 text-[13.5px] font-semibold text-gray-900 leading-[1.35] line-clamp-2 flex-1 tracking-[-0.01em]">
            {producto.nombre}
          </h3>
          <div className="flex">
            <span className="mt-px text-xs font-bold whitespace-nowrap px-2.5 py-0.75">
              Precio:
            </span>
            <div
              className="
              shrink-0 mt-px text-xs font-bold text-white bg-gray-900
              rounded-full tabular-nums whitespace-nowrap leading-normal
              px-2.5 py-0.75 tracking-[0.01em]"
            >
              ${producto.precio?.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Fila 2: Etiquetas */}
        <div className="flex gap-1.25 flex-wrap">
          <span
            className={`
          text-[9.5px] font-bold py-0.5 px-2 rounded-full border
          leading-[1.6] tracking-[0.06em] uppercase
          ${tipoStyle.pill}
        `}
          >
            {producto.tipo}
          </span>
          <span
            className="
          text-[9.5px] font-medium py-0.5 px-2 rounded-full
          bg-gray-50 text-gray-500 border border-gray-200
          tracking-[0.04em] uppercase max-w-35
          overflow-hidden text-ellipsis whitespace-nowrap leading-[1.6]
        "
          >
            {producto.subCategoria?.nombre || producto.categoria}
          </span>
        </div>

        {/* Fila 3: Ingredientes (solo platos) */}
        {esPlato ? (
          <div className="flex flex-col gap-1 min-h-7">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Ingredientes
            </span>
            {ingredientes.length > 0 ? (
              <div className="flex flex-wrap gap-1 max-h-10 overflow-hidden">
                {ingredientes.map((nombre, idx) => (
                  <span
                    key={`${producto.idProducto}-${nombre}-${idx}`}
                    className="text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 leading-tight"
                  >
                    {nombre}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[11px] italic text-gray-300">
                Sin ingredientes cargados
              </span>
            )}
          </div>
        ) : (
          <p className="m-0 text-[11px] text-gray-300 italic">
            {producto.tipo === EnumTipoProducto.Combo
              ? "Combo de productos"
              : "Artículo sin ingredientes"}
          </p>
        )}
      </div>

      {/* Badge "No disponible" */}
      {noDisponible && (
        <div
          className="
        absolute top-2 text-[9px] font-bold text-gray-600
        bg-gray-200 border border-gray-400 py-0.5 px-2
        rounded-full uppercase tracking-[0.08em]
      "
        >
          No disponible
        </div>
      )}
    </div>
  );
}

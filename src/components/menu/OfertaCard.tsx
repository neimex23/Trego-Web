import type { DTOProducto } from "../../data/DTOProducto.js";
import {  obtenerImagenOfertaCard } from "../../pages/restaurantes/utilitis/cloudinaryUtilitis.js";
import { obtenerPrecios, precioConDescuento } from "../../utils/productos.js";

interface OfertaCardProps {
  producto?: DTOProducto | undefined;
  onClick?: () => void;
}

export default function OfertaCard({ producto, onClick }: OfertaCardProps) {
  if (!producto) return null;

  const { nombre, oferta } = producto;
  const descuento = oferta?.descuento ?? 0;
  const { tieneOferta, conDescuento, original } = obtenerPrecios(producto);

return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white 
                text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2
                 focus-visible:ring-trego-orange sm:w-52"
    >
      <div className="relative w-full overflow-hidden">
        <img
          src={obtenerImagenOfertaCard(oferta?.urlImagen || "/placeholder.png")}
          alt={nombre ?? "Oferta"}
          className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-36"
          loading="lazy"
        />
        {tieneOferta && (
          <span className="absolute right-2 top-2 rounded-full bg-trego-orange px-2 py-1 text-center text-[10px] font-bold text-white shadow-sm">
            -{descuento}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-1 gap-1 sm:px-4 sm:py-2">
        <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-trego-orange">
          {nombre}
        </h3>
        <p className="line-clamp-2 text-[12px] leading-relaxed text-gray-400">
          {oferta?.descripcion}
        </p>
        
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2.5 gap-y-1 ">
          <span className="text-[16px] font-extrabold text-trego-orange">
            ${conDescuento}
          </span>
          <span className="text-[16px] font-semibold text-gray-400 line-through">
            ${original ?? 0}
          </span>
        </div>
      </div>
    </button>
  );
}

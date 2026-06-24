import React from "react";
import type { DTOProducto } from "../../../data/DTOProducto.js";
import { obtenerThumbnail } from "../utilitis/cloudinaryUtilitis.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface OfertaRestoCardProps {
  producto: DTOProducto;
  onClick?: (producto: DTOProducto) => void;
  esActiva?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Formatea un string de fecha a "DD/MM/AAAA" usando locale español. */
function formatFecha(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Íconos SVG inline (sin dependencias externas)
// ---------------------------------------------------------------------------

const IconImagen: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const IconCalendar: React.FC = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

const OfertaRestoCard: React.FC<OfertaRestoCardProps> = ({
  producto,
  onClick,
  esActiva = false,
}) => {
  const { nombre, tipo, oferta } = producto;

  if (!oferta) return null;

  const { descripcion, descuento, urlImagen, fechaInicio, fechaFin } = oferta;

  const isInteractive = !!onClick;

  const handleClick = () => onClick?.(producto);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(producto);
    }
  };

  return (
    <div
      className={[
        // Base
        "bg-white dark:bg-[#1e1e2e]",
        "border border-black/8 dark:border-white/10",
        "rounded-xl overflow-hidden",
        "flex flex-col w-full max-w-xs",
        "transition-all duration-150",
        // Interactividad (solo si tiene onClick)
        isInteractive
          ? [
              "cursor-pointer",
              "hover:border-black/20 dark:hover:border-white/25",
              "active:scale-[0.985]",
              "focus-visible:outline",
              "focus-visible:outline-offset-2 focus-visible:outline-[#534AB7]",
            ].join(" ")
          : "",
      ].join(" ")}
      onClick={isInteractive ? handleClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      aria-label={`Oferta: ${nombre ?? "Producto"}, ${Math.round(descuento)}% de descuento`}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className={` px-4 py-3 flex items-center justify-between gap-2
          ${esActiva ? "bg-trego-admin" : "bg-indigo-50"}`}
      >
        {/* Bloque de descuento */}
        <div className="flex flex-col gap-0.5">
          <span className={`text-[10px] font-medium tracking-widest leading-none
            ${esActiva ? "text-[#cdcbe9]" : "text-indigo-400"}`}>
            DESCUENTO
          </span>
          {/* descuento representa un entero: 30 = 30% */}
          <div className={`text-[28px] font-medium  leading-tight
            ${esActiva ? "text-white" : "text-trego-admin"}`}>
            {Math.round(descuento)}%
            <span className="text-sm font-normal"> off</span>
          </div>
        </div>

        {/* Pill de tipo (se omite si undefined) */}
        {tipo && (
          <span className={`text-[11px] font-medium  rounded-full px-3 py-1 shrink-0 max-w-27.5 truncate tracking-wide
          ${esActiva ? "text-[#EEEDFE] bg-white/15" : "text-trego-admin bg-trego-admin/15"}`}>
            {tipo}
          </span>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="p-4 flex gap-3 items-start flex-1">
        {/* Imagen o placeholder */}
        <div className="w-14 h-14 rounded-[10px] bg-[#E1F5EE] shrink-0 flex items-center justify-center overflow-hidden">
          {urlImagen ? (
            <img
              src={obtenerThumbnail(urlImagen)}
              alt={nombre ?? "Imagen del producto"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="flex items-center justify-center text-[#1D9E75]">
              <IconImagen />
            </span>
          )}
        </div>

        {/* Nombre + descripción */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {nombre && (
            <p className="text-[15px] font-medium text-gray-900 dark:text-gray-100 m-0 leading-snug truncate">
              {nombre}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 m-0 leading-relaxed line-clamp-2">
            {descripcion}
          </p>
        </div>
      </div>

      {/* ── Footer (fechas) ─────────────────────────────────────────────── */}
      <div className="px-4 pb-3 pt-2 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 border-t border-black/6 dark:border-white/[0.07]">
        <IconCalendar />
        <span>
          {formatFecha(fechaInicio)} — {formatFecha(fechaFin)}
        </span>
      </div>
    </div>
  );
};

export default OfertaRestoCard;

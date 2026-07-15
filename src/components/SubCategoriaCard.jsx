import { memo } from "react";
import { Link } from "react-router";
import { obtenerThumbnail } from "../pages/restaurantes/utilitis/cloudinaryUtilitis.js";

const cardBase =
  "block shrink-0 overflow-hidden rounded-[18px]  text-left bg-gray-50 border-gray-300 shadow transition hover:shadow-[0_3px_12px_rgba(0,0,0,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-trego-orange";

function SubCategoriaCard({ subcategoria, enGrid = false }) {
  const sizeClass = enGrid
    ? "w-full max-w-[220px] mx-auto self-start"
    : "w-[calc((100%-0.75rem)/2)] min-w-[136px] max-w-[172px] shrink-0 snap-start sm:w-[172px]";

  const imgClass = "relative h-20 sm:h-24 shrink-0 bg-gray-50";

  const imagen = subcategoria.urlImagen ?? null;
  const iniciales = subcategoria.nombre?.slice(0, 2)?.toUpperCase() ?? "—";
  const nombreSubcategoria = subcategoria.nombre ?? "Subcategoría";

  return (
    <Link
      to={`/subcategoria/${subcategoria.idSubCategoria}`}
      state={{ subcategoria }}
      className={`${cardBase} ${sizeClass} flex flex-col`}
      aria-label={`Explorar categoría ${nombreSubcategoria}`}
    >
      <div className={imgClass}>
        {imagen ? (
          <img
            src={obtenerThumbnail(imagen)}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-500"
            aria-hidden="true"
          >
            {iniciales}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-0.5 p-2.5">
        <h3 className="line-clamp-2 text-[13px] font-bold text-center leading-snug text-gray-900">
          {nombreSubcategoria}
        </h3>
        {subcategoria.categoria ? (
          <p className="w-full truncate text-[11px] text-center text-gray-600">
            {subcategoria.categoria}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default memo(SubCategoriaCard);

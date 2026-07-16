import { Link } from "react-router";
import { IconStar } from "./icons";
import { BadgeAbierto, BadgeOfertas } from "./badges";
import { formatearHorario } from "../utils/restaurantes.js";
import { obtenerImagenRestauranteCard } from "../pages/restaurantes/utilitis/cloudinaryUtilitis.js";

const cardBase =
  "block rounded-[18px] p-2.5 bg-gray-50 border-gray-300 shadow transition hover:shadow-[0_3px_12px_rgba(0,0,0,0.12)] sm:p-3";

export default function RestaurantCard({
  restaurante,
  modoBusqueda = false,
  enGrid = false,
  productosCoincidentes,
}) {
  const {
    idUsuario,
    nombre,
    descripcion,
    categoria,
    calificacionProm,
    abierto,
    reparteEnZona,
    tieneOfertas,
    fotoPerfil,
    direccion,
    horarioServicio,
  } = restaurante;

  const platos =
    productosCoincidentes ?? restaurante._productosCoincidentes ?? [];

  const zona = direccion?.nombre ?? "Pocitos";
  const horario = formatearHorario(
    horarioServicio?.[0] ?? null,
    horarioServicio?.[1] ?? null,
  );
  const tipoComida =
    platos.length > 0
      ? `Vende: ${platos
          .slice(0, 2)
          .map((p) => p.nombre)
          .join(", ")}${platos.length > 2 ? "…" : ""}`
      : descripcion || categoria || "Un tipo de comida";

  const mostrarCerrado = modoBusqueda && !abierto;
  const mostrarSinReparto = modoBusqueda && !reparteEnZona;

  let badgeEstado;
  if (mostrarCerrado) {
    badgeEstado = <BadgeAbierto abierto={false} texto="Cerrado" />;
  } else if (mostrarSinReparto) {
    badgeEstado = <BadgeAbierto abierto={false} texto="Fuera de zona" />;
  } else {
    badgeEstado = <BadgeAbierto abierto={abierto} />;
  }

  const widthClass = enGrid
    ? "w-full"
    : "w-[calc(100vw-2.5rem)] max-w-[330px] shrink-0 snap-start sm:w-[330px]";

  return (
    <Link
      to={`/restaurante/${idUsuario}`}
      className={`${cardBase} ${widthClass}`}
    >
      <article className="flex gap-2.5 sm:gap-3">
        <img
          src={obtenerImagenRestauranteCard(fotoPerfil)}
          alt=""
          className="h-12 w-12 shrink-0 self-center rounded-full bg-gray-50 object-cover sm:h-14 sm:w-14"
          loading="lazy"
        />

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5 sm:gap-1">
          <h3 className="line-clamp-2 text-[14px] font-bold leading-tight text-gray-900 sm:truncate sm:text-[15px]">
            {nombre}
          </h3>
          <p className="line-clamp-2 text-[12px] text-gray-600 sm:truncate sm:text-[13px]">
            {tipoComida}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-800 sm:text-[12px]">
            <span className="max-w-full truncate font-medium">{zona}</span>
            <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold">
              <IconStar className="h-3.5 w-3.5 text-amber-400" />
              {calificacionProm?.toFixed(1) ?? "—"}
            </span>
          </p>
        </div>

        <aside className="flex shrink-0 flex-col items-end justify-between gap-1 py-0.5 sm:gap-0">
          {badgeEstado}
          {tieneOfertas ? (
            <BadgeOfertas />
          ) : (
            <span className="hidden h-[26px] sm:block" aria-hidden />
          )}
          <span className="max-w-[4.5rem] text-right text-[10px] leading-tight text-gray-600 sm:max-w-none sm:text-[11px]">
            {horario}
          </span>
        </aside>
      </article>
    </Link>
  );
}

import type { DTORestaurante } from "../../data/DTORestaurante.js";
import { formatearHorario } from "../../utils/restaurantes.js";
import { IconClock, IconLocation } from "../icons.jsx";

interface RestauranteBannerProps {
  restaurante: any; // Debe de quedar como any hasta que se quite el mapeo, ahi deberia a pasar a se DTORestaurante
  cantidadResenas?: number;
}
export default function RestauranteBanner({
  restaurante,
  cantidadResenas,
}: RestauranteBannerProps) {
  const {
    nombre,
    calificacionProm,
    direccion,
    horaApertura,
    horaCierre,
    abierto,
    horarioServicio,
  } = restaurante;

  console.log("Viene en restaurante: ", restaurante);

  const ubicacion = direccion?.calle
    ? `${direccion.calle} - ${direccion.numero ?? "Montevideo"}`
    : "Montevideo";

  // Esto tiene que quedar como array hasta que no se saque el mapeo de restaurante y se use el DTORestaurante directamente como respuesta del backend
  const horario = formatearHorario(horarioServicio[0], horarioServicio[1]);

  return (
    <section className="overflow-hidden rounded-2xl shadow-sm">
      <header className="flex min-h-25 items-center justify-center bg-trego-brown px-6 py-8 sm:min-h-27.5">
        <h1 className="text-center text-2xl font-bold tracking-tight text-white sm:text-[28px]">
          {nombre}
        </h1>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 bg-trego-beige px-4 py-3 text-[13px] text-gray-800 sm:gap-x-10 sm:px-6">
        <span className="font-semibold text-gray-900">
          {(cantidadResenas ?? 0) > 0 && calificacionProm != null
            ? `${calificacionProm.toFixed(1)} (${cantidadResenas} reseñas)`
            : `Sin reseñas (${cantidadResenas ?? 0})`}
        </span>
        <span className="flex items-center gap-1.5 text-gray-700">
          <IconLocation className="h-4 w-4 shrink-0 text-gray-600" />
          {ubicacion}
        </span>
        <span className="flex items-center gap-1.5 text-gray-700">
          <IconClock className="h-4 w-4 shrink-0 text-gray-600" />
          {horario}
        </span>
        <span className="flex items-center gap-1.5 font-medium text-gray-800">
          <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
          {abierto ? "Abierto" : "Cerrado"}
        </span>
      </div>
    </section>
  );
}

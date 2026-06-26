import { ArrowDownAZ, ArrowUpAZ, Check, Trash2, X } from "lucide-react";
import type { DTOProducto } from "../../../data/DTOProducto.js";
import { TextInput } from "../../../components/TextInput.js";
import {
  TextBuscador,
  type SearchItem,
} from "../../../components/TextBuscador.js";
import { TextSelector } from "../../../components/TextSelector.js";

interface FiltroRestoProps<T> {
  labelBuscador?: string;
  nombreID: string; // requerido porque el buscador siempre está
  setNombreID: (valor: string) => void; // requerido
  desplegableTipo: string;
  filtroSelecte?: T | undefined;
  onChangeFiltroSelect?: (item: T | undefined) => void;
  listaFiltros?: T[];
  mapToItem?: (item: T) => SearchItem;
  orden: "ASC" | "DESC";
  setOrden: (nuevoOrden: "ASC" | "DESC") => void;
  hayFiltros: boolean;
  limpiarFiltros: () => void;
  porFecha?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  onChangeFechaDesde?: ((i: string) => void) | undefined;
  onChangeFechaHasta?: ((i: string) => void) | undefined;
  estadoFiltro?: "TODOS" | "HABILITADOS" | "DESHABILITADOS";
  onChangeEstadoFiltro?: (
    estado: "TODOS" | "HABILITADOS" | "DESHABILITADOS",
  ) => void;
  ofertasActivas?: boolean;
  setOfertasActivas?: (item: boolean) => void;
  fechaInicioLabel?: string;
  fechaFinLabel?: string;
}

export default function FiltrosRestaurantes<T>({
  nombreID,
  setNombreID,
  labelBuscador = "Buscar",
  desplegableTipo,
  filtroSelecte,
  onChangeFiltroSelect,
  listaFiltros,
  orden,
  setOrden,
  hayFiltros,
  limpiarFiltros,
  porFecha,
  fechaDesde,
  fechaHasta,
  onChangeFechaDesde,
  onChangeFechaHasta,
  mapToItem,
  estadoFiltro,
  onChangeEstadoFiltro,
  ofertasActivas,
  setOfertasActivas,
  fechaInicioLabel = "Desde",
  fechaFinLabel = "Hasta"
}: FiltroRestoProps<T>) {
  const toggleOrden = () => setOrden(orden === "ASC" ? "DESC" : "ASC");

  return (
    <div className="mb-6 flex flex-col w-full gap-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:p-5">
      {/* Buscador */}
      <label
        htmlFor="filtro-busqueda"
        className="flex flex-1 flex-col gap-1 min-w-70 max-w-120"
      >
        <span className="text-sm font-medium text-center text-gray-700">
          {labelBuscador}
        </span>
        <TextInput
          id={"filtro-busqueda"}
          onChange={setNombreID}
          value={nombreID}
          type="text"
          placeholder="Buscar nombre o ID"
          label={false}
          colorStyle="trego-restaurante"
        />
      </label>

      {/* Select Filtros */}
      {listaFiltros && onChangeFiltroSelect && mapToItem && (
        <>
          <label
            htmlFor="filtro-producto"
            className="flex flex-1 flex-col gap-1 min-w-70 max-w-120"
          >
            <span className="text-sm font-medium text-center text-gray-700">
              {desplegableTipo}
            </span>
            <TextBuscador<T>
              items={listaFiltros}
              mapToItem={mapToItem}
              onSelect={onChangeFiltroSelect}
              selected={filtroSelecte}
              placeholder="Buscar...."
            />
          </label>
        </>
      )}

      {porFecha ? (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-center text-gray-700">
              {fechaInicioLabel}
            </span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => onChangeFechaDesde?.(e.target.value)}
              className="rounded-xl border h-12 border-gray-400 px-4 py-2.5 text-sm focus:border-trego-orange focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-center text-gray-700">
              {fechaFinLabel}
            </span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => onChangeFechaHasta?.(e.target.value)}
              className="rounded-xl border h-12 border-gray-400 px-4 py-2.5 text-sm focus:border-trego-orange focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </>
      ) : undefined}

      {/* Botones de acción */}
      <div className="flex w-full flex-wrap items-end justify-start sm:justify-end gap-4 sm:gap-6">
        {/* Orden */}
        <div className="flex flex-col gap-1 min-w-11">
          <span className="text-sm font-medium text-gray-700">Orden</span>
          <button
            type="button"
            onClick={toggleOrden}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            title={`Ordenar ${orden === "ASC" ? "descendente" : "ascendente"}`}
          >
            {orden === "ASC" ? (
              <ArrowUpAZ className="h-5 w-5" />
            ) : (
              <ArrowDownAZ className="h-5 w-5" />
            )}
          </button>
        </div>

        {setOfertasActivas ? (
          <div className="flex flex-col gap-1 min-w-11">
            <span
              className={`text-sm font-medium text-gray-700`}
            >
              Activos
            </span>
            <label
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border transition-colors
                ${
                  ofertasActivas
                    ? "border-trego-restaurante/60 bg-trego-restaurante/15 text-trego-restaurante hover:bg-trego-restaurante/20"
                    : "border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100"
                }
              `}
            >
              <input
                type="checkbox"
                checked={ofertasActivas}
                onChange={() => setOfertasActivas(!ofertasActivas)}
                className="hidden"
              />
              {ofertasActivas ? (
                <Check className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </label>
          </div>
        ) : undefined}

        {onChangeEstadoFiltro && (
          <div className="flex flex-col gap-1 min-w-40 max-w-120 flex-1">
            <span className="text-sm font-medium text-center text-gray-700">
              Estado
            </span>
            <TextSelector<"TODOS" | "HABILITADOS" | "DESHABILITADOS">
              items={["TODOS", "HABILITADOS", "DESHABILITADOS"]}
              placeholder=""
              selected={estadoFiltro}
              onSelect={(item) => onChangeEstadoFiltro(item ?? "TODOS")}
              mapToItem={(item) => ({
                id: item,
                label:
                  item === "TODOS"
                    ? "Todos"
                    : item === "HABILITADOS"
                      ? "Habilitados"
                      : "Deshabilitados",
              })}
              className="h-11.5!"
              colorStyle="trego-restaurante"
            />
          </div>
        )}

        {/* Limpiar */}
        <div className="flex flex-col gap-1 min-w-11">
          <span
            className={`text-sm font-medium ${
              hayFiltros ? "text-gray-700 " : "text-gray-300"
            }`}
          >
            Limpiar
          </span>
          <button
            type="button"
            onClick={limpiarFiltros}
            disabled={!hayFiltros}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
              hayFiltros
                ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                : "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
            title="Limpiar filtros"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

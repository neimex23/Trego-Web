import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import EmptyState from "../../../components/EmptyState.jsx";
import { administradorApi } from "../../../api/administradorApi.js";
import type { DTORestaurante } from "../../../data/DTORestaurante.js";
import type { DTODireccion } from "../../../data/DTODireccion.js";
import AccionesEstadoCuenta from "../components/AccionesEstadoCuenta.js";
import AdminPageShell, { AdminPageHeader } from "../components/AdminPageShell.js";
import {
  clasesBadgeEstadoRestaurante,
  etiquetaEstadoRestaurante,
  esCuentaRestauranteActiva,
  normalizarRestauranteAdmin,
  obtenerEstadoRestaurante,
} from "../utils/estadoRestauranteAdmin.js";

type FiltroEstado = "todos" | "habilitados" | "pendientes" | "deshabilitados";
type OrdenLista = "az" | "za" | "calificacion";

function formatearDireccion(direccion?: DTODireccion): string {
  if (!direccion) return "—";

  const partes = [
    direccion.calle,
    direccion.numero != null ? String(direccion.numero) : null,
    direccion.apartamento ? `Apto ${direccion.apartamento}` : null,
    direccion.esquina?.trim() ? `Esq. ${direccion.esquina}` : null,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(", ") : "—";
}

function CampoDetalle({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-sm text-gray-800">{valor}</dd>
    </div>
  );
}

function MetricaCard({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm notranslate" translate="no">
      <p className="text-xs sm:text-sm font-medium text-gray-500">{etiqueta}</p>
      <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900">{valor}</p>
    </div>
  );
}

export default function ListarRestaurantesPage() {
  const location = useLocation();
  const [restaurantes, setRestaurantes] = useState<DTORestaurante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<DTORestaurante | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [orden, setOrden] = useState<OrdenLista>("az");
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const cerrarModal = () => {
    setSeleccionado(null);
  };

  const handleEstadoActualizado = async (
    nombre: string,
    estabaHabilitado: boolean,
  ) => {
    const accion = estabaHabilitado ? "deshabilitada" : "habilitada";
    setMensajeExito(`La cuenta de "${nombre}" fue ${accion} correctamente.`);
    cerrarModal();
    await cargarDatos();
    window.dispatchEvent(new Event("trego-restaurante-gestionado"));
  };

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const [habilitados, pendientes] = await Promise.all([
        administradorApi.obtenerRestaurantesHabilitados(),
        administradorApi.obtenerRestaurantesPendientes(),
      ]);

      const porId = new Map<number, DTORestaurante>();

      for (const r of habilitados) {
        if (r.idRestaurante != null) {
          porId.set(
            r.idRestaurante,
            normalizarRestauranteAdmin({ ...r, habilitado: true }),
          );
        }
      }
      for (const r of pendientes) {
        if (r.idRestaurante != null && !porId.has(r.idRestaurante)) {
          porId.set(
            r.idRestaurante,
            normalizarRestauranteAdmin({ ...r, habilitado: false }),
          );
        }
      }

      setRestaurantes([...porId.values()]);
    } catch {
      setError("No se pudo cargar la lista de restaurantes.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos, location.pathname]);

  useEffect(() => {
    const refrescar = () => cargarDatos();
    window.addEventListener("trego-restaurante-gestionado", refrescar);
    return () => {
      window.removeEventListener("trego-restaurante-gestionado", refrescar);
    };
  }, [cargarDatos]);

  const metricas = useMemo(() => {
    let habilitados = 0;
    let pendientes = 0;
    let deshabilitados = 0;

    for (const r of restaurantes) {
      const estado = obtenerEstadoRestaurante(r);
      if (estado === "habilitado") habilitados++;
      else if (estado === "pendiente") pendientes++;
      else deshabilitados++;
    }

    return {
      total: restaurantes.length,
      habilitados,
      pendientes,
      deshabilitados,
    };
  }, [restaurantes]);

  const restaurantesFiltrados = useMemo(() => {
    let lista = [...restaurantes];

    if (filtroEstado === "habilitados") {
      lista = lista.filter((r) => obtenerEstadoRestaurante(r) === "habilitado");
    } else if (filtroEstado === "pendientes") {
      lista = lista.filter((r) => obtenerEstadoRestaurante(r) === "pendiente");
    } else if (filtroEstado === "deshabilitados") {
      lista = lista.filter(
        (r) => obtenerEstadoRestaurante(r) === "deshabilitado",
      );
    }

    const q = busqueda.trim().toLowerCase();
    if (q) {
      lista = lista.filter((r) =>
        (r.nombre ?? "").toLowerCase().includes(q),
      );
    }

    lista.sort((a, b) => {
      if (orden === "calificacion") {
        return (b.calificacionProm ?? 0) - (a.calificacionProm ?? 0);
      }
      const nombreA = (a.nombre ?? "").toLowerCase();
      const nombreB = (b.nombre ?? "").toLowerCase();
      if (orden === "za") return nombreB.localeCompare(nombreA);
      return nombreA.localeCompare(nombreB);
    });

    return lista;
  }, [restaurantes, filtroEstado, busqueda, orden]);

  const estadoSeleccionado = seleccionado
    ? obtenerEstadoRestaurante(seleccionado)
    : null;

  return (
    <>
      <AdminPageShell>
      <div className="mx-auto w-full max-w-5xl">
        <AdminPageHeader
          titulo="Todos los registrados"
          descripcion="Vista general de restaurantes habilitados, pendientes y deshabilitados."
        />

        {mensajeExito && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {mensajeExito}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!cargando && !error && (
          <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <MetricaCard etiqueta="Total registrados" valor={metricas.total} />
            <MetricaCard etiqueta="Habilitados" valor={metricas.habilitados} />
            <MetricaCard etiqueta="Pendientes" valor={metricas.pendientes} />
            <MetricaCard
              etiqueta="Deshabilitados"
              valor={metricas.deshabilitados}
            />
          </div>
        )}

        {!cargando && !error && (
          <div className="mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex w-full flex-1 min-w-0 sm:min-w-[200px] flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Buscar</span>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre del restaurante..."
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-trego-admin focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="flex w-full sm:w-auto flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Estado</span>
              <select
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(e.target.value as FiltroEstado)
                }
                className="notranslate rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-trego-admin focus:outline-none focus:ring-2 focus:ring-blue-100"
                translate="no"
              >
                <option value="todos">Todos</option>
                <option value="habilitados">Habilitados</option>
                <option value="pendientes">Pendientes</option>
                <option value="deshabilitados">Deshabilitados</option>
              </select>
            </label>

            <label className="flex w-full sm:w-auto flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Orden</span>
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value as OrdenLista)}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-trego-admin focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="az">A – Z</option>
                <option value="za">Z – A</option>
                <option value="calificacion">Mejor calificación</option>
              </select>
            </label>
          </div>
        )}

        {cargando ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-trego-admin" />
            <p className="text-sm text-gray-400">Cargando restaurantes...</p>
          </div>
        ) : restaurantesFiltrados.length === 0 ? (
          <EmptyState
            mensaje={
              restaurantes.length === 0
                ? "No hay restaurantes registrados"
                : "No hay resultados para los filtros aplicados"
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {restaurantesFiltrados.map((restaurante) => {
              const estado = obtenerEstadoRestaurante(restaurante);

              return (
              <li key={restaurante.idRestaurante}>
                <button
                  type="button"
                  onClick={() => setSeleccionado(restaurante)}
                  className="w-full rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-base sm:text-lg font-semibold text-gray-900">
                      {restaurante.nombre ?? "Sin nombre"}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${clasesBadgeEstadoRestaurante(estado)}`}
                    >
                      {etiquetaEstadoRestaurante(estado)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {restaurante.categoria && (
                      <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600">
                        {restaurante.categoria}
                      </span>
                    )}
                    {restaurante.calificacionProm != null && (
                      <span className="text-sm text-gray-600">
                        ★ {restaurante.calificacionProm.toFixed(1)}
                      </span>
                    )}
                  </div>
                </button>
              </li>
              );
            })}
          </ul>
        )}
      </div>
      </AdminPageShell>

      {seleccionado && estadoSeleccionado && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de ${seleccionado.nombre ?? "restaurante"}`}
            className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6 flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                    {seleccionado.nombre ?? "Sin nombre"}
                  </h2>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${clasesBadgeEstadoRestaurante(estadoSeleccionado)}`}
                  >
                    {etiquetaEstadoRestaurante(estadoSeleccionado)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <CampoDetalle
                  etiqueta="RUT"
                  valor={seleccionado.rut ?? "—"}
                />
                <CampoDetalle
                  etiqueta="Email"
                  valor={seleccionado.email ?? "—"}
                />
                <CampoDetalle
                  etiqueta="Teléfono"
                  valor={seleccionado.telefono ?? "—"}
                />
                <CampoDetalle
                  etiqueta="Categoría"
                  valor={seleccionado.categoria ?? "—"}
                />
                <div className="sm:col-span-2">
                  <CampoDetalle
                    etiqueta="Dirección"
                    valor={formatearDireccion(seleccionado.direccion)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <CampoDetalle
                    etiqueta="Descripción"
                    valor={seleccionado.descripcion ?? "—"}
                  />
                </div>
              </dl>

              {seleccionado.idRestaurante != null && (
                <AccionesEstadoCuenta
                  idUsuario={seleccionado.idRestaurante}
                  nombre={seleccionado.nombre ?? "Restaurante"}
                  habilitado={seleccionado.habilitado ?? false}
                  cuentaHabilitada={
                    seleccionado.habilitado
                      ? (seleccionado.cuentaHabilitada ?? true)
                      : undefined
                  }
                  esSolicitudPendiente={!seleccionado.habilitado}
                  onEstadoActualizado={() =>
                    handleEstadoActualizado(
                      seleccionado.nombre ?? "Restaurante",
                      esCuentaRestauranteActiva(seleccionado),
                    )
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

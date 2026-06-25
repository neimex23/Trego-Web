import { useCallback, useEffect, useState } from "react";
import type { DTORestaurante } from "../../../data/DTORestaurante.js";
import type { DTODireccion } from "../../../data/DTODireccion.js";
import { administradorApi } from "../../../api/administradorApi.js";
import EmptyState from "../../../components/EmptyState.jsx";
import AdminPageShell, { AdminPageHeader } from "../components/AdminPageShell.js";

type VistaModal = "detalle" | "rechazar";

function formatearHora(hora?: string): string | null {
  if (!hora) return null;
  return hora.length >= 5 ? hora.slice(0, 5) : hora;
}

function formatearHorario(restaurante: DTORestaurante): string {
  const apertura = formatearHora(restaurante.horaApertura ?? undefined);
  const cierre = formatearHora(restaurante.horaCierre ?? undefined);
  if (apertura && cierre) return `${apertura} - ${cierre}`;
  return "—";
}

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

export default function GestionRestaurantesPage() {
  const [restaurantes, setRestaurantes] = useState<DTORestaurante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<DTORestaurante | null>(null);
  const [vistaModal, setVistaModal] = useState<VistaModal>("detalle");
  const [motivo, setMotivo] = useState("");
  const [accionLoading, setAccionLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const cargarLista = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const lista = await administradorApi.obtenerRestaurantesPendientes();
      setRestaurantes(lista);
    } catch {
      setError("No se pudo cargar la lista de solicitudes pendientes.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  const cerrarModal = () => {
    setSeleccionado(null);
    setVistaModal("detalle");
    setMotivo("");
  };

  const removerDeLista = (idRestaurante: number) => {
    setRestaurantes((prev) =>
      prev.filter((r) => r.idRestaurante !== idRestaurante),
    );
    cerrarModal();
  };

  const handleHabilitar = async () => {
    if (!seleccionado?.idRestaurante) return;

    setAccionLoading(true);
    setError(null);

    try {
      await administradorApi.habilitarRestaurante(seleccionado.idRestaurante);
      setMensajeExito(`"${seleccionado.nombre}" fue habilitado correctamente.`);
      removerDeLista(seleccionado.idRestaurante);
      window.dispatchEvent(new Event("trego-restaurante-gestionado"));
    } catch {
      setError("No se pudo habilitar el restaurante. Intentá de nuevo.");
    } finally {
      setAccionLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!seleccionado?.idRestaurante) return;

    const motivoLimpio = motivo.trim();
    if (!motivoLimpio) {
      setError("Ingresá un motivo para rechazar la solicitud.");
      return;
    }

    setAccionLoading(true);
    setError(null);

    try {
      await administradorApi.rechazarRestaurante(
        seleccionado.idRestaurante,
        motivoLimpio,
      );
      setMensajeExito(
        `La solicitud de "${seleccionado.nombre}" fue rechazada.`,
      );
      removerDeLista(seleccionado.idRestaurante);
      window.dispatchEvent(new Event("trego-restaurante-gestionado"));
    } catch {
      setError("No se pudo rechazar el restaurante. Intentá de nuevo.");
    } finally {
      setAccionLoading(false);
    }
  };

  return (
<>
  <AdminPageShell>
  <div className="mx-auto w-full max-w-5xl">
    <AdminPageHeader
      titulo="Solicitudes de alta"
      descripcion="Revisá y aprobá los restaurantes pendientes de habilitación."
      centrado
    />

    {mensajeExito && (
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm">
        {mensajeExito}
      </div>
    )}

    {error && !seleccionado && (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm">
        {error}
      </div>
    )}

    {cargando ? (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        <p className="text-sm text-gray-400">Cargando solicitudes...</p>
      </div>
    ) : restaurantes.length === 0 ? (
      <EmptyState
        mensaje="No hay solicitudes pendientes"
        onLimpiarFiltros={undefined}
      />
    ) : (
      <ul className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {restaurantes.map((restaurante) => (
          <li key={restaurante.idRestaurante}>
            <button
              type="button"
              onClick={() => {
                setSeleccionado(restaurante);
                setVistaModal("detalle");
                setMotivo("");
                setError(null);
              }}
              className="group w-full gap-3 sm:gap-5 rounded-2xl border flex flex-col border-gray-300 bg-white p-4 sm:p-5 text-left shadow-sm transition-all duration-200 hover:border-orange-300 hover:shadow-md hover:shadow-orange-100"
            >
              <p className="truncate text-base sm:text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                Restaurante: {restaurante.nombre} 
              </p>
              {restaurante.categoria && (
                <span className="mt-2 inline-block rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600 transition-colors group-hover:bg-orange-100">
                  {restaurante.categoria}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
  </AdminPageShell>

  {seleccionado && (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/10 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !accionLoading) cerrarModal();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${seleccionado.nombre}`}
        className="max-h-[90dvh] w-full max-w-2xl overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-xl transition-all duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {seleccionado.fotoPortada && (
          <div className="overflow-hidden rounded-t-2xl">
            <img
              src={seleccionado.fotoPortada}
              alt={`Portada de ${seleccionado.nombre}`}
              className="w-full max-h-64 object-contain bg-gray-100 sm:max-h-72"
            />
          </div>
        )}

        <div className="max-h-[calc(90dvh-12rem)] overflow-y-auto p-4 sm:p-6">
          <div className="mb-4 sm:mb-6 flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                {seleccionado.nombre}
              </h2>
            </div>
            <button
              type="button"
              onClick={cerrarModal}
              disabled={accionLoading}
              className="rounded-lg px-2 py-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm">
              {error}
            </div>
          )}

          {vistaModal === "detalle" ? (
            <>
              <dl className="grid gap-4 sm:grid-cols-2">
                <CampoDetalle etiqueta="Nombre" valor={seleccionado.nombre ?? "—"} />
                <CampoDetalle etiqueta="RUT" valor={seleccionado.rut ?? "—"} />
                <CampoDetalle etiqueta="Teléfono" valor={seleccionado.telefono ?? "—"} />
                <CampoDetalle etiqueta="Email" valor={seleccionado.email ?? "—"} />
                <CampoDetalle
                  etiqueta="Dirección"
                  valor={formatearDireccion(seleccionado.direccion)}
                />
                <div className="sm:col-span-2">
                  <CampoDetalle
                    etiqueta="Descripción"
                    valor={seleccionado.descripcion ?? "—"}
                  />
                </div>
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setVistaModal("rechazar");
                    setError(null);
                  }}
                  disabled={accionLoading}
                  className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={handleHabilitar}
                  disabled={accionLoading}
                  className="rounded-xl bg-trego-admin px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-trego-add disabled:opacity-50"
                >
                  {accionLoading ? "Procesando..." : "Habilitar"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-600">
                Ingresá el motivo del rechazo. Se enviará por email al restaurante.
              </p>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={4}
                placeholder="Motivo del rechazo..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setVistaModal("detalle");
                    setMotivo("");
                    setError(null);
                  }}
                  disabled={accionLoading}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRechazar}
                  disabled={accionLoading}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                >
                  {accionLoading ? "Procesando..." : "Confirmar rechazo"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )}
</>
  );
}

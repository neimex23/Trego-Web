import { useCallback, useEffect, useMemo, useState } from "react";
import type { DTODireccion } from "../../../data/DTODireccion.js";
import type { DTOClienteResponse } from "../../../data/DTOClienteResponse.js";
import { administradorApi } from "../../../api/administradorApi.js";
import EmptyState from "../../../components/EmptyState.jsx";
import AccionesEstadoCuenta from "../components/AccionesEstadoCuenta.js";
import AdminPageShell, { AdminPageHeader } from "../components/AdminPageShell.js";


type FiltroEstado = "todos" | "habilitados" | "deshabilitados";
type OrdenLista = "az" | "za";

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
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
      <p className="text-xs sm:text-sm font-medium text-gray-500">{etiqueta}</p>
      <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900">{valor}</p>
    </div>
  );
}

function InicialAvatar({ nombre }: { nombre?: string }) {
  const inicial = (nombre?.trim().charAt(0) ?? "?").toUpperCase();
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-600">
      {inicial}
    </span>
  );
}

export default function ListarClientesPage() {
  const [clientes, setClientes] = useState<DTOClienteResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<DTOClienteResponse | null>(
    null,
  );
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
  };

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const lista = await administradorApi.obtenerClientesRegistrados();
      setClientes(lista);
    } catch {
      setError("No se pudo cargar la lista de clientes.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const metricas = useMemo(() => {
    const habilitados = clientes.filter((c) => c.habilitado).length;
    const deshabilitados = clientes.filter((c) => !c.habilitado).length;
    return {
      total: clientes.length,
      habilitados,
      deshabilitados,
    };
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    let lista = [...clientes];

    if (filtroEstado === "habilitados") {
      lista = lista.filter((c) => c.habilitado);
    } else if (filtroEstado === "deshabilitados") {
      lista = lista.filter((c) => !c.habilitado);
    }

    const q = busqueda.trim().toLowerCase();
    if (q) {
      lista = lista.filter(
        (c) =>
          (c.nombre ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q),
      );
    }

    lista.sort((a, b) => {
      const nombreA = (a.nombre ?? "").toLowerCase();
      const nombreB = (b.nombre ?? "").toLowerCase();
      if (orden === "za") return nombreB.localeCompare(nombreA);
      return nombreA.localeCompare(nombreB);
    });

    return lista;
  }, [clientes, filtroEstado, busqueda, orden]);

  return (
    <>
      <AdminPageShell>
      <div className="mx-auto w-full max-w-5xl">
        <AdminPageHeader
          titulo="Todos los clientes"
          descripcion="Vista general de clientes registrados en la plataforma."
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
          <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
            <MetricaCard etiqueta="Total registrados" valor={metricas.total} />
            <MetricaCard etiqueta="Habilitados" valor={metricas.habilitados} />
            <MetricaCard
              etiqueta="Deshabilitados"
              valor={metricas.deshabilitados}
            />
          </div>
        )}

        {!cargando && !error && (
          <div className="mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex w-full flex-1 min-w-0 sm:min-w-50 flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Buscar</span>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre o email..."
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
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-trego-admin focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="todos">Todos</option>
                <option value="habilitados">Habilitados</option>
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
              </select>
            </label>
          </div>
        )}

        {cargando ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-trego-admin" />
            <p className="text-sm text-gray-400">Cargando clientes...</p>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <EmptyState
            mensaje={
              clientes.length === 0
                ? "No hay clientes registrados"
                : "No hay resultados para los filtros aplicados"
            }
            onLimpiarFiltros={() => {}}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {clientesFiltrados.map((cliente) => (
              <li key={cliente.id}>
                <button
                  type="button"
                  onClick={() => setSeleccionado(cliente)}
                  className="w-full rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    {cliente.fotoPerfil ? (
                      <img
                        src={cliente.fotoPerfil}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <InicialAvatar nombre={cliente.nombre ?? ""} />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-base sm:text-lg font-semibold text-gray-900">
                          {cliente.nombre ?? "Sin nombre"}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            cliente.habilitado
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {cliente.habilitado ? "Habilitado" : "Deshabilitado"}
                        </span>
                      </div>

                      {cliente.email && (
                        <p className="mt-1 truncate text-sm text-gray-500">
                          {cliente.email}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      </AdminPageShell>

      {seleccionado && (
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
            aria-label={`Detalle de ${seleccionado.nombre ?? "cliente"}`}
            className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6 flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  {seleccionado.fotoPerfil ? (
                    <img
                      src={seleccionado.fotoPerfil}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg font-semibold text-orange-600">
                      {(seleccionado.nombre?.trim().charAt(0) ?? "?").toUpperCase()}
                    </span>
                  )}

                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                      {seleccionado.nombre ?? "Sin nombre"}
                    </h2>
                    <span
                      className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        seleccionado.habilitado
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {seleccionado.habilitado ? "Habilitado" : "Deshabilitado"}
                    </span>
                  </div>
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
                  etiqueta="Email"
                  valor={seleccionado.email ?? "—"}
                />
                <CampoDetalle
                  etiqueta="Teléfono"
                  valor={seleccionado.telefono ?? "—"}
                />
                <CampoDetalle
                  etiqueta="UID"
                  valor={seleccionado.uidCliente ?? "—"}
                />
                <CampoDetalle
                  etiqueta="Rol"
                  valor={seleccionado.rol ?? "—"}
                />
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Direcciones
                  </dt>
                  <dd className="mt-1 text-sm text-gray-800">
                    {seleccionado.direcciones &&
                    seleccionado.direcciones.length > 0 ? (
                      <ul className="space-y-2">
                        {seleccionado.direcciones.map((dir, index) => (
                          <li
                            key={`${dir.calle}-${dir.numero}-${index}`}
                            className="rounded-lg bg-gray-50 px-3 py-2"
                          >
                            {formatearDireccion(dir)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>

              {seleccionado.id != null && (
                <AccionesEstadoCuenta
                  idUsuario={seleccionado.id}
                  nombre={seleccionado.nombre ?? "Cliente"}
                  habilitado={seleccionado.habilitado ?? false}
                  onEstadoActualizado={() =>
                    handleEstadoActualizado(
                      seleccionado.nombre ?? "Cliente",
                      seleccionado.habilitado ?? false,
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

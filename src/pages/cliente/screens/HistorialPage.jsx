import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, CheckCircle2, History, Store } from "lucide-react";
import { listarRestaurantesTodos } from "../../../api/restaurantesApi.js";
import EmptyState from "../../../components/EmptyState.jsx";
import RealizarReclamoModal from "../../../components/reclamos/RealizarReclamoModal.jsx";
import { obtenerMisPedidos } from "../../../api/pedidosApi.js";

function formatearFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearMonto(total) {
  if (total == null || Number.isNaN(Number(total))) return "—";
  return `$ ${Number(total).toLocaleString("es-UY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function soloFecha(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

const ESTADOS_HISTORIAL = [
  { valor: "Pagado", etiqueta: "Pagado" },
  { valor: "EnPreparacion", etiqueta: "En preparación" },
  { valor: "EnCamino", etiqueta: "En camino" },
  { valor: "Entregado", etiqueta: "Entregado" },
  { valor: "Cancelado", etiqueta: "Cancelado" },
  { valor: "Reembolsado", etiqueta: "Reembolsado" },
];

const ESTADOS_CON_RECLAMO = new Set(["EnPreparacion", "EnCamino", "Entregado"]);

function estadoPermiteReclamo(estado) {
  return ESTADOS_CON_RECLAMO.has(estado);
}

function etiquetaEstado(estado) {
  const map = Object.fromEntries(
    ESTADOS_HISTORIAL.map((e) => [e.valor, e.etiqueta]),
  );
  return map[estado] ?? estado ?? "—";
}

function claseEstado(estado) {
  switch (estado) {
    case "Entregado":
      return "bg-emerald-50 text-emerald-700";
    case "EnCamino":
    case "EnPreparacion":
      return "bg-orange-50 text-orange-700";
    case "Cancelado":
    case "Reembolsado":
    case "PagoRechazado":
      return "bg-red-50 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function MetricaCard({ etiqueta, valor }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-medium text-gray-500">{etiqueta}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
        {valor}
      </p>
    </div>
  );
}

export default function HistorialPage() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [nombresRestaurante, setNombresRestaurante] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRestauranteId, setFiltroRestauranteId] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [pedidosConReclamo, setPedidosConReclamo] = useState(() => new Set());
  const [pedidoParaReclamo, setPedidoParaReclamo] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [listaPedidos, restaurantes] = await Promise.all([
        obtenerMisPedidos(),
        listarRestaurantesTodos().catch(() => []),
      ]);
      const mapa = {};
      for (const r of restaurantes) {
        const id = r.idRestaurante ?? r.idUsuario;
        if (id != null && r.nombre) mapa[id] = r.nombre;
      }
      setNombresRestaurante(mapa);
      setPedidos(listaPedidos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el historial de compras",
      );
      setPedidos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      navigate("/login/cliente", { replace: true });
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, [cargarDatos, navigate]);

  const nombreRestaurante = useCallback(
    (idRestaurante) => {
      if (idRestaurante == null) return "Restaurante";
      return (
        nombresRestaurante[idRestaurante] ?? `Restaurante #${idRestaurante}`
      );
    },
    [nombresRestaurante],
  );

  const restaurantesEnHistorial = useMemo(() => {
    const ids = new Set();
    for (const p of pedidos) {
      if (p.idRestaurante != null) ids.add(p.idRestaurante);
    }
    return [...ids]
      .map((id) => ({ id, nombre: nombreRestaurante(id) }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [pedidos, nombreRestaurante]);

  const pedidosFiltrados = useMemo(() => {
    let lista = [...pedidos];

    if (filtroRestauranteId) {
      const id = Number(filtroRestauranteId);
      lista = lista.filter((p) => p.idRestaurante === id);
    }

    if (filtroEstado) {
      lista = lista.filter((p) => p.estado === filtroEstado);
    }

    const q = busqueda.trim().toLowerCase();
    if (q) {
      lista = lista.filter((p) =>
        nombreRestaurante(p.idRestaurante).toLowerCase().includes(q),
      );
    }

    if (fechaDesde) {
      lista = lista.filter((p) => {
        const f = soloFecha(p.fechaCreacion);
        return f && f >= fechaDesde;
      });
    }

    if (fechaHasta) {
      lista = lista.filter((p) => {
        const f = soloFecha(p.fechaCreacion);
        return f && f <= fechaHasta;
      });
    }

    return lista.sort((a, b) => {
      const ta = new Date(a.fechaCreacion ?? 0).getTime();
      const tb = new Date(b.fechaCreacion ?? 0).getTime();
      return tb - ta;
    });
  }, [
    pedidos,
    filtroRestauranteId,
    filtroEstado,
    busqueda,
    fechaDesde,
    fechaHasta,
    nombreRestaurante,
  ]);

  const metricas = useMemo(() => {
    const totalGastado = pedidosFiltrados.reduce(
      (acc, p) => acc + (p.total ?? 0),
      0,
    );
    return {
      cantidad: pedidosFiltrados.length,
      totalGastado,
    };
  }, [pedidosFiltrados]);

  const hayFiltrosActivos =
    !!busqueda.trim() ||
    !!filtroRestauranteId ||
    !!filtroEstado ||
    !!fechaDesde ||
    !!fechaHasta;

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroRestauranteId("");
    setFiltroEstado("");
    setFechaDesde("");
    setFechaHasta("");
  };

  function yaReclamado(pedido) {
    return !!pedido?.tieneReclamo || pedidosConReclamo.has(pedido?.idPedido);
  }

  function puedeReclamar(pedido) {
    if (!pedido?.idPedido || !estadoPermiteReclamo(pedido.estado)) return false;
    return !yaReclamado(pedido);
  }

  function abrirReclamo(pedido) {
    setPedidoParaReclamo(pedido);
  }

  function cerrarReclamo() {
    setPedidoParaReclamo(null);
  }

  function onReclamoExito(idPedido) {
    setPedidosConReclamo((prev) => new Set(prev).add(idPedido));
    setMensajeExito("Reclamo realizado. El restaurante revisará tu caso.");
    window.setTimeout(() => setMensajeExito(null), 6000);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto max-w-275 px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3 px-1">
          <div>
            <div className="mb-2 flex items-center gap-2 text-trego-orange">
              <History className="h-6 w-6" aria-hidden />
              <span className="text-sm font-semibold uppercase tracking-wide">
                Mi cuenta
              </span>
            </div>
            <h1 className="text-[22px] font-bold text-gray-900 sm:text-2xl">
              Historial de compras
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/restaurantes")}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50"
          >
            Volver al inicio
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        {mensajeExito && (
          <p
            role="status"
            className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
            {mensajeExito}
          </p>
        )}

        {!cargando && !error && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <MetricaCard
              etiqueta="Pedidos (filtro actual)"
              valor={metricas.cantidad}
            />
            <MetricaCard
              etiqueta="Total gastado (filtro actual)"
              valor={formatearMonto(metricas.totalGastado)}
            />
          </div>
        )}

        {!cargando && !error && (
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end sm:p-5">
            <label className="flex min-w-[200px] flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">
                Buscar por restaurante
              </span>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre del restaurante..."
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-trego-orange focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>

            <label className="flex min-w-[180px] flex-1 flex-col gap-1 sm:max-w-xs">
              <span className="text-sm font-medium text-gray-700">
                Restaurante
              </span>
              <select
                value={filtroRestauranteId}
                onChange={(e) => setFiltroRestauranteId(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-trego-orange focus:outline-none focus:ring-2 focus:ring-orange-100"
              >
                <option value="">Todos</option>
                {restaurantesEnHistorial.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-[160px] flex-1 flex-col gap-1 sm:max-w-[200px]">
              <span className="text-sm font-medium text-gray-700">Estado</span>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-trego-orange focus:outline-none focus:ring-2 focus:ring-orange-100"
              >
                <option value="">Todos</option>
                {ESTADOS_HISTORIAL.map((e) => (
                  <option key={e.valor} value={e.valor}>
                    {e.etiqueta}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Desde</span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-trego-orange focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Hasta</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-trego-orange focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {cargando ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-trego-orange" />
            <p className="text-sm text-gray-400">Cargando historial...</p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <EmptyState
            mensaje={
              pedidos.length === 0
                ? "Aún no tenés compras registradas"
                : "No hay pedidos para los filtros aplicados"
            }
            onLimpiarFiltros={hayFiltrosActivos ? limpiarFiltros : undefined}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {pedidosFiltrados.map((pedido) => (
              <li key={pedido.idPedido}>
                <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-trego-orange">
                        <Store className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-gray-900">
                          {nombreRestaurante(pedido.idRestaurante)}
                        </h2>
                        <p className="text-xs text-gray-500">
                          Pedido #{pedido.idPedido ?? "—"}
                        </p>
                      </div>
                    </div>
                    {pedido.estado && (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${claseEstado(pedido.estado)}`}
                      >
                        {etiquetaEstado(pedido.estado)}
                      </span>
                    )}
                  </div>

                  <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Fecha
                      </dt>
                      <dd className="mt-0.5 font-medium text-gray-800">
                        {formatearFecha(pedido.fechaCreacion)}
                      </dd>
                    </div>
                    <div className="text-right">
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Monto pagado
                      </dt>
                      <dd className="mt-0.5 text-lg font-bold text-trego-orange">
                        {formatearMonto(pedido.total)}
                      </dd>
                    </div>
                  </dl>

                  {puedeReclamar(pedido) && (
                    <button
                      type="button"
                      onClick={() => abrirReclamo(pedido)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-trego-orange transition hover:bg-orange-100"
                    >
                      <AlertCircle className="h-4 w-4" aria-hidden />
                      Realizar reclamo
                    </button>
                  )}

                  {estadoPermiteReclamo(pedido.estado) &&
                    yaReclamado(pedido) && (
                      <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500">
                        <AlertCircle className="h-4 w-4" aria-hidden />
                        Ya registraste un reclamo para este pedido
                      </div>
                    )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>

      <RealizarReclamoModal
        abierto={!!pedidoParaReclamo}
        pedido={pedidoParaReclamo}
        nombreRestaurante={
          pedidoParaReclamo
            ? nombreRestaurante(pedidoParaReclamo.idRestaurante)
            : ""
        }
        onCerrar={cerrarReclamo}
        onExito={onReclamoExito}
      />
    </div>
  );
}

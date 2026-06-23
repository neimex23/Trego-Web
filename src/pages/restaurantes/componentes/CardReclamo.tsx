import { useState } from "react";
import {
  AlertCircle,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { EnumEstadoReclamo } from "../../../data/EnumEstadoReclamo.js";
import type { ResolverReclamoPayload } from "../../../data/DTOReclamo.js";

export interface ClienteReclamo {
  nombre: string;
  email?: string;
  telefono?: string;
}

export interface Reclamo {
  idReclamo: number;
  descripcion: string;
  cliente: ClienteReclamo;
  idPedido: number;
  fechaPedido: string | Date;
  fechaReclamo: string | Date;
  estado: EnumEstadoReclamo;
  resolucion?: string;
  totalPedido?: number;
}

export interface CardReclamoProps {
  reclamo: Reclamo;
  onResolver?: (
    idReclamo: number,
    payload: ResolverReclamoPayload,
  ) => Promise<void>;
}

const formatearMonto = (valor: number): string =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(valor);

const formatearFecha = (fecha: string | Date): string => {
  const d = new Date(fecha);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const minutosTranscurridos = (fecha: string | Date): number => {
  const ahora = new Date();
  const inicio = new Date(fecha);
  return Math.floor((ahora.getTime() - inicio.getTime()) / 60_000);
};

const ESTADO_STYLES: Record<
  EnumEstadoReclamo,
  { header: string; badge: string; border: string }
> = {
  [EnumEstadoReclamo.Pendiente]: {
    header: "bg-amber-500 text-white",
    badge: "bg-white text-amber-600",
    border: "border-amber-400",
  },
  [EnumEstadoReclamo.Resuelto]: {
    header: "bg-green-600 text-white",
    badge: "bg-white text-green-700",
    border: "border-green-400",
  },
  [EnumEstadoReclamo.Rechazado]: {
    header: "bg-gray-500 text-white",
    badge: "bg-white text-gray-600",
    border: "border-gray-300",
  },
};

type ModoResolucion = "aceptar" | "rechazar" | null;

export function CardReclamo({ reclamo, onResolver }: CardReclamoProps) {
  const [cargando, setCargando] = useState(false);
  const [modo, setModo] = useState<ModoResolucion>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const finalizado =
    reclamo.estado === EnumEstadoReclamo.Resuelto ||
    reclamo.estado === EnumEstadoReclamo.Rechazado;

  const minutos = minutosTranscurridos(reclamo.fechaReclamo);
  const esCritico =
    reclamo.estado === EnumEstadoReclamo.Pendiente && minutos > 60;
  const styles = ESTADO_STYLES[reclamo.estado];
  const totalPedido = reclamo.totalPedido;
  const montoFormateado =
    totalPedido != null && Number.isFinite(totalPedido)
      ? formatearMonto(totalPedido)
      : null;

  const ejecutarResolucion = async (payload: ResolverReclamoPayload) => {
    if (!onResolver) return;
    setErrorLocal(null);
    setCargando(true);
    try {
      await onResolver(reclamo.idReclamo, payload);
      setModo(null);
      setMotivoRechazo("");
    } catch (err) {
      setErrorLocal(
        err instanceof Error ? err.message : "No se pudo resolver el reclamo",
      );
    } finally {
      setCargando(false);
    }
  };

  const confirmarAceptacion = () => {
    void ejecutarResolucion({ accion: true });
  };

  const confirmarRechazo = () => {
    const motivo = motivoRechazo.trim();
    if (!motivo) {
      setErrorLocal("Indicá el motivo del rechazo");
      return;
    }
    void ejecutarResolucion({ accion: false, motivoRechazo: motivo });
  };

  return (
    <div
      className={`bg-white border-2 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 flex flex-col ${
        esCritico
          ? "border-red-500 bg-red-50/10"
          : `${styles.border} hover:border-gray-300`
      }`}
    >
      <div
        className={`px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b ${
          esCritico ? "bg-red-500 text-white" : styles.header
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-black px-2 py-0.5 rounded ${
              esCritico ? "bg-white text-red-600" : styles.badge
            }`}
          >
            RECLAMO #{reclamo.idReclamo}
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20">
            {esCritico ? "URGENTE" : reclamo.estado}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Clock
            size={14}
            className={esCritico ? "animate-spin" : ""}
            style={esCritico ? { animationDuration: "3s" } : undefined}
          />
          <span>Hace {minutos} min</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="flex-1 w-full space-y-3">
          <h2 className="font-bold text-gray-900 text-center uppercase tracking-wide text-sm">
            Motivo del reclamo
          </h2>

          <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-800 leading-relaxed">
              {reclamo.descripcion}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-2">
              <ShoppingBag size={15} className="text-gray-400 shrink-0" />
              <div>
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">
                  Pedido
                </span>
                <span className="text-sm font-black text-gray-900">
                  #{reclamo.idPedido}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-2">
              <Calendar size={15} className="text-gray-400 shrink-0" />
              <div>
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">
                  Fecha reclamo
                </span>
                <span className="text-xs font-semibold text-gray-700">
                  {formatearFecha(reclamo.fechaReclamo)}
                </span>
              </div>
            </div>
          </div>

          {montoFormateado && (
            <p className="text-sm text-gray-600">
              Monto del pedido:{" "}
              <strong className="text-gray-900">{montoFormateado}</strong>
            </p>
          )}
        </div>

        <div className="w-full md:w-72 bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3 text-sm h-full">
          <h2 className="font-bold text-gray-900 text-center uppercase tracking-wide text-xs">
            Cliente
          </h2>

          <div>
            <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">
              Nombre
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-gray-800">
              <User size={15} className="text-gray-400 shrink-0" />
              {reclamo.cliente.nombre}
            </div>
          </div>

          {reclamo.cliente.email && (
            <div>
              <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">
                Email
              </span>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Mail size={15} className="text-gray-400 shrink-0" />
                <span className="text-xs break-all">{reclamo.cliente.email}</span>
              </div>
            </div>
          )}

          {reclamo.cliente.telefono && (
            <div>
              <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">
                Teléfono
              </span>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Phone size={15} className="text-gray-400 shrink-0" />
                <span>{reclamo.cliente.telefono}</span>
              </div>
            </div>
          )}

          {finalizado && reclamo.resolucion && (
            <div className="pt-3 border-t border-gray-200 mt-auto">
              <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">
                {reclamo.estado === EnumEstadoReclamo.Rechazado
                  ? "Motivo del rechazo"
                  : "Resolución"}
              </span>
              <span className="text-sm font-bold text-gray-700 mt-0.5 block">
                {reclamo.resolucion}
              </span>
            </div>
          )}
        </div>
      </div>

      {!finalizado && onResolver && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3">
          {errorLocal && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorLocal}
            </p>
          )}

          {modo === null && (
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setModo("rechazar");
                  setErrorLocal(null);
                }}
                disabled={cargando}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle size={18} />
                Rechazar reclamo
              </button>
              <button
                type="button"
                onClick={() => {
                  setModo("aceptar");
                  setErrorLocal(null);
                }}
                disabled={cargando}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                Aceptar y reintegrar
              </button>
            </div>
          )}

          {modo === "aceptar" && montoFormateado && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Se aceptará el reclamo y se procesará un reintegro de{" "}
                <strong>{montoFormateado}</strong> al cliente. Se le notificará
                por email y en la app.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModo(null)}
                  disabled={cargando}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarAceptacion}
                  disabled={cargando}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {cargando ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Confirmar aceptación
                </button>
              </div>
            </div>
          )}

          {modo === "rechazar" && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Motivo del rechazo
                </span>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => {
                    setMotivoRechazo(e.target.value);
                    setErrorLocal(null);
                  }}
                  rows={3}
                  placeholder="Explicá por qué se rechaza el reclamo..."
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                />
              </label>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setModo(null);
                    setMotivoRechazo("");
                  }}
                  disabled={cargando}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarRechazo}
                  disabled={cargando}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {cargando ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  Confirmar rechazo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

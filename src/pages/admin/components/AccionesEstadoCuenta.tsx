import { useState } from "react";
import { Link } from "react-router";
import { administradorApi } from "../../../api/administradorApi.js";

type VistaAccion = "accion" | "motivo" | "confirmar-habilitar";

interface AccionesEstadoCuentaProps {
  idUsuario: number;
  nombre: string;
  /** Para clientes: estado de la cuenta. Para restaurantes aprobados: ver cuentaHabilitada. */
  habilitado: boolean;
  /** Solo restaurantes aprobados: indica si la cuenta puede iniciar sesión. */
  cuentaHabilitada?: boolean;
  /** Aviso para solicitudes pendientes de aprobación (restaurantes). */
  esSolicitudPendiente?: boolean;
  onEstadoActualizado: () => void;
}

export default function AccionesEstadoCuenta({
  idUsuario,
  nombre,
  habilitado,
  cuentaHabilitada,
  esSolicitudPendiente = false,
  onEstadoActualizado,
}: AccionesEstadoCuentaProps) {
  const [vista, setVista] = useState<VistaAccion>("accion");
  const [motivo, setMotivo] = useState("");
  const [accionLoading, setAccionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esRestaurante = cuentaHabilitada !== undefined;
  const cuentaActiva = esRestaurante ? cuentaHabilitada : habilitado;

  const handleDeshabilitar = async () => {
    const motivoLimpio = motivo.trim();
    if (!motivoLimpio) {
      setError("Ingresá un motivo para deshabilitar la cuenta.");
      return;
    }

    setAccionLoading(true);
    setError(null);

    try {
      await administradorApi.cambiarEstadoUsuario(idUsuario, false, motivoLimpio);
      onEstadoActualizado();
    } catch {
      setError("No se pudo deshabilitar la cuenta. Intentá de nuevo.");
    } finally {
      setAccionLoading(false);
    }
  };

  const handleHabilitar = async () => {
    setAccionLoading(true);
    setError(null);

    try {
      await administradorApi.cambiarEstadoUsuario(idUsuario, true);
      onEstadoActualizado();
    } catch {
      setError("No se pudo habilitar la cuenta. Intentá de nuevo.");
    } finally {
      setAccionLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      {esSolicitudPendiente && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Para aprobar una solicitud nueva, usá{" "}
          <Link
            to="/admin/restaurantes"
            className="font-semibold underline hover:text-amber-900"
          >
            Solicitudes pendientes
          </Link>
          .
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {esSolicitudPendiente ? null : (
        <>
          {vista === "accion" && cuentaActiva && (
            <>
              <p className="mb-4 text-sm text-gray-600">
                El usuario no podrá iniciar sesión ni usar la app. Se enviará un
                email con el motivo indicado.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setVista("motivo");
                    setError(null);
                  }}
                  disabled={accionLoading}
                  className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  Deshabilitar cuenta
                </button>
              </div>
            </>
          )}

          {vista === "accion" && !cuentaActiva && (
            <>
              <p className="mb-4 text-sm text-gray-600">
                ¿Restaurar el acceso de &quot;{nombre}&quot; a la plataforma?
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setVista("confirmar-habilitar");
                    setError(null);
                  }}
                  disabled={accionLoading}
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
                >
                  Habilitar cuenta
                </button>
              </div>
            </>
          )}

          {vista === "motivo" && (
            <>
              <p className="mb-3 text-sm text-gray-600">
                Ingresá el motivo de la deshabilitación. Se enviará por email al
                usuario.
              </p>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={4}
                placeholder="Motivo..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setVista("accion");
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
                  onClick={handleDeshabilitar}
                  disabled={accionLoading}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                >
                  {accionLoading ? "Procesando..." : "Confirmar deshabilitación"}
                </button>
              </div>
            </>
          )}

          {vista === "confirmar-habilitar" && (
            <>
              <p className="mb-4 text-sm text-gray-600">
                La cuenta de &quot;{nombre}&quot; volverá a tener acceso completo a
                la plataforma.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setVista("accion");
                    setError(null);
                  }}
                  disabled={accionLoading}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleHabilitar}
                  disabled={accionLoading}
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
                >
                  {accionLoading ? "Procesando..." : "Confirmar habilitación"}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

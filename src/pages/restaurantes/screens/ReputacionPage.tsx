import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Star } from "lucide-react";
import { listarComentariosRestaurante } from "../../../api/comentariosApi.js";
import EstrellasCalificacion from "../../../components/menu/EstrellasCalificacion.jsx";
import { useRestauranteActual } from "../../../hooks/useRestauranteActual.js";
import type { DTOComentario } from "../../../data/DTOComentario.js";
import { RESTAURANTE_PAGE_CLASS } from "../componentes/RestaurantePageShell.js";

function formatearFecha(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function deduplicarComentarios(lista: DTOComentario[]): DTOComentario[] {
  const vistos = new Set<string>();
  return (lista ?? []).filter((c) => {
    const clave = c.nombreCliente ?? String(c.idComentario);
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}

function calcularPromedio(comentarios: DTOComentario[]): number | null {
  if (!comentarios.length) return null;
  const suma = comentarios.reduce((acc, c) => acc + (c.calificacion ?? 0), 0);
  return suma / comentarios.length;
}

export default function ReputacionPage() {
  const { restaurante, loading: cargandoPerfil } = useRestauranteActual();
  const [comentarios, setComentarios] = useState<DTOComentario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restauranteId = restaurante?.idRestaurante ?? null;

  const cargarResenas = useCallback(async () => {
    if (!restauranteId) return;
    setCargando(true);
    setError(null);
    try {
      const lista = deduplicarComentarios(
        await listarComentariosRestaurante(restauranteId),
      );
      setComentarios(lista);
    } catch (e) {
      setComentarios([]);
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar las reseñas.",
      );
    } finally {
      setCargando(false);
    }
  }, [restauranteId]);

  useEffect(() => {
    if (cargandoPerfil) return;
    if (!restauranteId) {
      setCargando(false);
      return;
    }
    cargarResenas();
  }, [cargarResenas, cargandoPerfil, restauranteId]);

  const promedioLista = useMemo(() => calcularPromedio(comentarios), [comentarios]);
  const promedioGlobal = useMemo(() => {
    const raw = restaurante?.calificacionProm ?? promedioLista;
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [restaurante?.calificacionProm, promedioLista]);
  const cantidad = comentarios.length;
  const loading = cargandoPerfil || cargando;

  return (
    <div className={RESTAURANTE_PAGE_CLASS}>
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Clasificación global</h1>
        <p className="mt-1 text-sm text-gray-500">
          Calificación promedio y comentarios de tus clientes.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando clasificación...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50">
              <Star className="h-10 w-10 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-center sm:text-left">
              {promedioGlobal != null && cantidad > 0 ? (
                <>
                  <p className="text-4xl font-bold text-gray-900">
                    {promedioGlobal.toFixed(1)}
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
                    <EstrellasCalificacion
                      valor={Math.round(promedioGlobal)}
                      soloLectura
                      tamano="md"
                    />
                    <span className="text-sm text-gray-500">
                      ({cantidad} reseña{cantidad !== 1 ? "s" : ""})
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-gray-700">
                    Sin calificar
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Aún no recibiste reseñas de clientes.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Comentarios de clientes
        </h2>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando comentarios...</span>
          </div>
        ) : comentarios.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            Cuando un cliente deje una reseña, aparecerá acá.
          </p>
        ) : (
          <ul className="space-y-4">
            {comentarios.map((c) => (
              <li
                key={c.idComentario ?? `${c.nombreCliente}-${c.fechaCreacion}`}
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-gray-800">
                    {c.nombreCliente ?? "Cliente"}
                  </span>
                  <div className="flex items-center gap-2">
                    <EstrellasCalificacion
                      valor={c.calificacion ?? 0}
                      soloLectura
                      tamano="sm"
                    />
                    {c.fechaCreacion ? (
                      <span className="text-xs text-gray-400">
                        {formatearFecha(c.fechaCreacion)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">
                  {c.texto}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

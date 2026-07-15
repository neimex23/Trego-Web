import { useEffect, useState } from "react";
import { cerrarLocal } from "../../../api/apiRestaurante.js";

interface ModalAvisoCierreProps {
  restauranteAbierto: boolean;
  cierreProgramado: string | null;
  horaCierre: string | undefined;
  onLocalCerradoAutomaticamente: () => void;
}

export default function ModalAvisoCierre({
  restauranteAbierto,
  cierreProgramado,
  horaCierre,
  onLocalCerradoAutomaticamente,
}: ModalAvisoCierreProps) {
  const [mostrarAvisoCierre, setMostrarAvisoCierre] = useState(false);
  const [mostrarAvisoCerrado, setMostrarAvisoCerrado] = useState(false);
  const [avisoDescartado, setAvisoDescartado] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState<{
    minutos: number;
    segundos: number;
  } | null>(null);

  // Reiniciar el descarte cuando el restaurante se abra o cambie el cierre
  useEffect(() => {
    setAvisoDescartado(false);
  }, [restauranteAbierto, cierreProgramado]);

  useEffect(() => {
    if (!restauranteAbierto || !cierreProgramado) {
      setMostrarAvisoCierre(false);
      setTiempoRestante(null);
      return;
    }

    const calcularRestante = () => {
      const cierre = new Date(cierreProgramado);
      if (isNaN(cierre.getTime())) return null;

      const diffSegundos = Math.floor((cierre.getTime() - Date.now()) / 1000);
      return diffSegundos;
    };

    let intervalo: ReturnType<typeof setInterval> | undefined;

    const tick = async () => {
      const restante = calcularRestante();
      if (restante === null) return;

      const mins = Math.floor(Math.max(restante, 0) / 60);
      const secs = Math.max(restante, 0) % 60;
      setTiempoRestante({ minutos: mins, segundos: secs });

      // Mostrar aviso si quedan 5 min o menos (300 seg) y no se ha descartado
      if (restante <= 300 && restante > 0 && !avisoDescartado) {
        setMostrarAvisoCierre(true);
      } else {
        setMostrarAvisoCierre(false);
      }

      // Cierre automático cuando se alcance o pase la hora
      if (restante <= 0) {
        clearInterval(intervalo);
        try {
          await cerrarLocal();
        } catch (error) {
          console.warn(
            "Cierre automático: el backend ya cerró o hubo un error",
            error,
          );
        } finally {
          onLocalCerradoAutomaticamente();
          setMostrarAvisoCierre(false);
          setMostrarAvisoCerrado(true);
        }
      }
    };

    tick();
    intervalo = setInterval(tick, 1000);

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [restauranteAbierto, cierreProgramado, avisoDescartado, onLocalCerradoAutomaticamente]);

  return (
    <>
      {mostrarAvisoCierre && tiempoRestante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-[min(20rem,calc(100vw-2rem))] p-5 sm:p-6 text-center animate-fade-in">
            <div className="text-4xl mb-4">⏰</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              El local cerrará pronto
            </h2>
            <p className="text-3xl font-bold text-red-500 mb-2">
              {tiempoRestante.minutos}:
              {tiempoRestante.segundos.toString().padStart(2, "0")}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Se cerrará automáticamente al llegar a las{" "}
              {cierreProgramado
                ? new Date(cierreProgramado).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : horaCierre}{" "}
              hs.
            </p>
            <button
              onClick={() => {
                setMostrarAvisoCierre(false);
                setAvisoDescartado(true);
              }}
              className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {mostrarAvisoCerrado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-[min(20rem,calc(100vw-2rem))] p-5 sm:p-6 text-center animate-fade-in">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              El local se cerró
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Se alcanzó el horario de cierre programado y el local dejó de
              estar visible para los clientes.
            </p>
            <button
              onClick={() => setMostrarAvisoCerrado(false)}
              className="w-full py-2 bg-trego-restaurante hover:opacity-90 text-white font-medium rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
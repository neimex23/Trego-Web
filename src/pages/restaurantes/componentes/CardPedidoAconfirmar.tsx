import { useState } from "react";
import { Clock, MapPin, User, Check, X, AlertTriangle, MessageSquareWarning } from "lucide-react";
import { EnumEstadoPedido } from "../../../data/EnumEstadoPedido.js";
import {
  ESTADOS_FLUJO,
  getEstadosDisponibles,
} from "../utilitis/funcionesCard.js";
import { TextSelector } from "../../../components/TextSelector.js";
import type { DTOPedido } from "../../../data/DTOPedido.js";
import {
  formatearDireccion,
  tiempoTranscurrido,
  toDateString,
} from "../utilitis/funcionesListado.js";

interface Props {
  pedido: DTOPedido;
  onConfirmar?: (pedido: DTOPedido | undefined) => void; // para pagados -> confirmar
  onCancelar?: (pedido: DTOPedido | undefined) => void; // para pagados -> rechazar
  onActualizarEstado?: (
    pedido: DTOPedido,
    nuevoEstado: EnumEstadoPedido,
  ) => void; // nueva prop
}

export default function CardPedidoAconfirmar({
  pedido,
  onConfirmar,
  onCancelar,
  onActualizarEstado,
}: Props) {
  const esCrítico = tiempoTranscurrido(pedido.fechaCreacion) > 8;
  const [nuevoEstado, setNuevoEstado] = useState<
    EnumEstadoPedido | undefined
  >();

  const estadosPermitidos = getEstadosDisponibles(pedido.estado);
  const opcionesSelector = ESTADOS_FLUJO.filter((op) =>
    estadosPermitidos.includes(op.id),
  );
  const handleActualizarEstado = () => {
    if (!nuevoEstado || !onActualizarEstado) return;

    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas mover el pedido #${pedido.idPedido} a "${nuevoEstado}"? Esta acción no se puede deshacer.`,
    );

    if (confirmacion) {
      onActualizarEstado(pedido, nuevoEstado);
      setNuevoEstado(undefined);
    }
  };

  const finalizado =
    pedido.estado === EnumEstadoPedido.Reembolsado ||
    pedido.estado === EnumEstadoPedido.Entregado;
  const esPagado = pedido.estado === EnumEstadoPedido.Pagado;
  const mostrarSelectorCambio =
    estadosPermitidos.length > 0 &&
    !esPagado &&
    onActualizarEstado !== undefined;

  return (
    <div
      className={`bg-white border-2 rounded-2xl overflow-hidden shadow-sm transition-all duration-200 flex flex-col ${
        esCrítico && !finalizado
          ? "border-red-500 bg-red-50/10"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* HEADER */}
      <div
        className={`px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b ${
          esCrítico && !finalizado
            ? "bg-red-500 text-white"
            : "bg-gray-50 text-gray-700"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-black px-2 py-0.5 rounded ${
              esCrítico && !finalizado
                ? "bg-white text-red-600"
                : "bg-gray-800 text-white"
            }`}
          >
            #{pedido.idPedido}
          </span>
        </div>
        {!finalizado ? (
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Clock size={14} className={esCrítico ? "animate-spin-slow" : ""} />
            <span>
              Hace {tiempoTranscurrido(pedido.fechaCreacion)} min en espera
            </span>
            {esCrítico && (
              <AlertTriangle size={14} className="animate-bounce" />
            )}
          </div>
        ) : pedido.estado === EnumEstadoPedido.Reembolsado ? (
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span>
              Cancelado - Pedido el: {toDateString(pedido.fechaCreacion)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span>
              Entregado - Pedido el: {toDateString(pedido.fechaCreacion)}
            </span>
          </div>
        )}
      </div>

      {/* CUERPO */}
      <div className="p-5 flex-1 h-full flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="flex-1 w-full space-y-3">
          <h1 className="font-bold text-gray-900 text-center uppercase tracking-wide">
            Productos Pedidos
          </h1>
          {pedido.productos?.map((prod, idx) => (
            <div
              key={idx}
              className="bg-gray-50 border border-gray-100 rounded-xl p-1 flex items-start gap-2"
            >
              <span className="flex items-center justify-center w-6 h-6 bg-green-600 text-white font-black text-base rounded-lg min-w-8">
                {prod.cantidad}
              </span>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm uppercase">
                  {prod.producto?.nombre}
                </p>
                {prod.observaciones && (
                  <p className="mt-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded inline-block">
                    ⚠️ NOTA: {prod.observaciones}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full md:max-w-xs md:w-85 bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col h-full text-sm">
          <div>
            <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">
              Cliente
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-gray-800">
              <User size={15} className="text-gray-400" />
              {pedido.nombreCliente}
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">
              Dirección
            </span>
            <div className="flex items-start gap-1.5 text-gray-600">
              <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <span className="line-clamp-2">
                {formatearDireccion(pedido.direccionEntrega)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 flex justify-center items-center mt-auto">
            <div>
              <span className="text-xs text-gray-400 text-center font-bold block uppercase tracking-wider">
                Total
              </span>
              <span className="text-base font-black text-gray-950">
                ${pedido.total?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA INFERIOR */}
      {esPagado && onCancelar && onConfirmar && (
        <div className="px-4 sm:px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <button
            onClick={() => onCancelar(pedido)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-100 transition-all flex items-center justify-center gap-1.5"
          >
            <X size={16} />
            RECHAZAR
          </button>
          <button
            onClick={() => onConfirmar(pedido)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-black text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Check size={16} strokeWidth={3} />
            CONFIRMAR PEDIDO
          </button>
        </div>
      )}

      {pedido.tieneReclamo && (
        <div className="px-5 py-3 bg-amber-50 border-t border-amber-200 flex items-center gap-2.5">
          <MessageSquareWarning
            size={18}
            className="text-amber-600 shrink-0"
            strokeWidth={2.2}
          />
          <span className="text-sm font-bold text-amber-800">
            Este pedido tiene un reclamo asociado
          </span>
        </div>
      )}

      {onActualizarEstado && mostrarSelectorCambio && (
        <div className="px-4 sm:px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:justify-end">
          <div className="w-full sm:w-70">
            <TextSelector
              items={opcionesSelector}
              mapToItem={(item) => ({ id: item.id, label: item.label })}
              placeholder="Estado del Pedido"
              selected={
                nuevoEstado
                  ? { id: nuevoEstado, label: nuevoEstado }
                  : undefined
              }
              onSelect={(item) => setNuevoEstado(item?.id)}
            />
          </div>
          <button
            onClick={handleActualizarEstado}
            disabled={!nuevoEstado}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-black text-white bg-trego-restaurante hover:bg-trego-restaurante shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={16} strokeWidth={3} />
            ACTUALIZAR ESTADO
          </button>
        </div>
      )}
    </div>
  );
}

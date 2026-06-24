import {
  Check,
  ChevronRight,
  ClipboardClock,
  Edit,
  Key,
  LogOut,
  Store,
  User,
} from "lucide-react";
import { DateTimeInput } from "../DateTimeInput.js";
import { useEffect, useRef, useState } from "react";
import { getInitials } from "../../utils/funcionesFormateo.js";
import { obtenerThumbnail } from "../../pages/restaurantes/utilitis/cloudinaryUtilitis.js";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface MenuUsuarioProps {
  nombre: string;
  email: string;
  tipoUser: string;
  avatarUrl?: string;
  restauranteAbierto?: boolean | undefined;
  onVerPerfil?: () => void;
  onCambiarContrasenia?: () => void;
  onCerrarSesion: () => void;
  onToggleRestaurante?:
    | ((horaCierre?: string, horaApertura?: string) => void)
    | undefined;
  horaCierre?: string | undefined;
  horaApertura?: string | undefined;
  onChangeHoraCierre?: ((item: string | undefined) => void) | undefined;
  onChangeHoraApertura?: ((item: string | undefined) => void) | undefined;
  cierreProgramado?: string | undefined;
  onChangeCierreProgramado?: ((item: string) => void) | undefined;
  verPerfil?: boolean;
  cambiarContrasenia?: boolean;
  verHistorial?: boolean;
  onChangeHistorial?: () => void;
}
// ─── Componente ───────────────────────────────────────────────────────────────

export default function MenuUsuario({
  nombre,
  email,
  tipoUser,
  avatarUrl,
  restauranteAbierto,
  onVerPerfil,
  onCerrarSesion,
  onToggleRestaurante,
  horaCierre,
  horaApertura,
  onChangeHoraCierre,
  onChangeHoraApertura,
  cierreProgramado,
  onChangeCierreProgramado,
  onCambiarContrasenia,
  verPerfil,
  cambiarContrasenia,
  verHistorial,
  onChangeHistorial,
}: MenuUsuarioProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorApertura, setErrorApertura] = useState<string | null>(null);
  const [internalHora, setInternalHora] = useState(horaCierre ?? "");
  const [internalHoraApertura, setInternalHoraApertura] = useState(
    horaApertura ?? "",
  );
  const cierreRef = useRef<HTMLInputElement>(null);
  const aperturaRef = useRef<HTMLInputElement>(null);
  const cierreProgRef = useRef<HTMLInputElement>(null);

  // Estado del cierre programado (instante exacto, editable de forma independiente)
  const [isEditingCierreProg, setIsEditingCierreProg] = useState(false);
  const [errorCierreProg, setErrorCierreProg] = useState<string | null>(null);
  const [internalCierreProg, setInternalCierreProg] = useState(
    cierreProgramado ?? "",
  );

  // Sincronizar estado interno cuando la prop cambia (ej. carga inicial)
  useEffect(() => {
    setInternalHora(horaCierre ?? "");
  }, [horaCierre]);

  useEffect(() => {
    setInternalHoraApertura(horaApertura ?? "");
  }, [horaApertura]);

  useEffect(() => {
    if (!isEditingCierreProg) {
      setInternalCierreProg(cierreProgramado ?? "");
    }
  }, [cierreProgramado, isEditingCierreProg]);

  const handleCierreProgChange = (value: string) => {
    setInternalCierreProg(value);
    setErrorCierreProg(null);
  };

  const handleSaveCierreProg = () => {
    if (!internalCierreProg || internalCierreProg.trim() === "") {
      setErrorCierreProg("El cierre programado no puede estar vacío");
      return;
    }
    onChangeCierreProgramado?.(internalCierreProg);
    setIsEditingCierreProg(false);
    setErrorCierreProg(null);
  };

  const startEditCierreProg = () => {
    setIsEditingCierreProg(true);
    setTimeout(() => {
      cierreProgRef.current?.focus();
    }, 50);
  };

  // Validar antes de intentar abrir
  const handleToggle = () => {
    setIsEditing(false);

    if (restauranteAbierto) {
      onToggleRestaurante?.();
      return;
    }

    if (!internalHora || internalHora.trim() === "") {
      setError("Debes ingresar una hora de cierre");
      return;
    }

    if (!internalHoraApertura || internalHoraApertura.trim() === "") {
      setErrorApertura("Debes ingresar una hora de Apertura");
      return;
    }

    setError(null);
    setErrorApertura(null);

    onToggleRestaurante?.(internalHora, internalHoraApertura);
    onChangeHoraCierre?.(internalHora);
    onChangeHoraApertura?.(internalHoraApertura);
  };

  const handleHoraChange = (value: string) => {
    setInternalHora(value);
    setError(null);
    // ❌ Se elimina la propagación inmediata al padre
  };

  const handleHoraAperturaChange = (value: string) => {
    setInternalHoraApertura(value);
    setErrorApertura(null);
    // ❌ Se elimina la propagación inmediata al padre
  };

  const handleSaveEdit = () => {
    if (!internalHora || internalHora.trim() === "") {
      setError("La hora de cierre no puede estar vacía");
      return;
    }
    // ✅ Solo aquí se comunica la hora al padre
    onChangeHoraCierre?.(internalHora);
    onChangeHoraApertura?.(internalHoraApertura);
    setIsEditing(false);
    setError(null);
  };

  // Iniciar modo edición
  const startEdit = () => {
    setIsEditing(true);
    // Enfocar el input después de que se renderice
    setTimeout(() => {
      cierreRef.current?.focus();
    }, 50);
  };

  // Determinar si el input debe estar deshabilitado
  const isInputDisabled = restauranteAbierto === true && !isEditing;
  const isInputDisabledApertura = restauranteAbierto === true && !isEditing;

  return (
    <div className="absolute right-0 mt-2 w-86 rounded-2xl border border-gray-100 bg-white shadow-xl z-50 frame-fade-in overflow-hidden">
      {/* ── Encabezado con avatar ── */}
      <div className="flex items-center gap-3.5 p-4 pb-3.5 border-b border-gray-100">
        {avatarUrl ? (
          <img
            src={obtenerThumbnail(avatarUrl)}
            alt={nombre}
            className="w-22 h-22 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-22 h-22 rounded-full bg-blue-50 flex items-center justify-center text-base font-medium text-blue-600 shrink-0 select-none">
            {getInitials(nombre)}
          </div>
        )}
        <div className="min-w-0 ">
          <p className="font-medium text-[15px] text-gray-900 mb-0.5">
            ¡Hola, {nombre}!
          </p>
          <p className="text-xs text-gray-400 mb-1.5 truncate">{email}</p>
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="p-1.5">
        {/* Toggle restaurante */}
        {tipoUser === "Restaurante" && (
          <>
            <div
              role="button"
              tabIndex={0}
              onClick={handleToggle}
              onKeyDown={(e) => e.key === "Enter" && handleToggle()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                !restauranteAbierto &&
                (!internalHora.trim() || !internalHoraApertura.trim())
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50"
              }`}
            >
              <Store
                size={32}
                className={`shrink-0 ${restauranteAbierto ? "text-trego-restaurante" : "text-gray-400"}`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium leading-tight ${restauranteAbierto ? "text-trego-restaurante" : "text-gray-800"}`}
                >
                  Restaurante
                </p>
                <p
                  className={`text-sm leading-tight mt-0.5 transition-colors ${restauranteAbierto ? "text-emerald-600" : "text-gray-400"}`}
                >
                  {restauranteAbierto ? "Abierto" : "Cerrado"}
                </p>
              </div>
              {/* Switch (igual) */}
              <div
                className={`relative w-12 h-7 rounded-full shrink-0 transition-colors duration-200 ${restauranteAbierto ? "bg-emerald-500" : "bg-gray-200"}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${restauranteAbierto ? "left-6" : "left-1"}`}
                />
              </div>
            </div>
            <div className="flex flex-row w-full gap-2 px-3 py-2 items-center">
              <div className="w-full">
                <DateTimeInput
                  ref={aperturaRef}
                  mode="time"
                  label="Hora Apertura"
                  onChange={handleHoraAperturaChange}
                  value={internalHoraApertura}
                  disabled={isInputDisabledApertura}
                  error={errorApertura ?? false}
                  className="text-sm px-1 py-1"
                />
              </div>
              <div className="w-full">
                <DateTimeInput
                  ref={cierreRef}
                  mode="time"
                  label="Hora Cierre"
                  onChange={handleHoraChange}
                  value={internalHora}
                  disabled={isInputDisabled}
                  error={error ?? false}
                  className="text-sm px-1 py-1"
                />
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={isEditing ? handleSaveEdit : startEdit}
                  className={`flex items-center justify-center transition-colors ${
                    restauranteAbierto
                      ? isEditing
                        ? "text-emerald-600 hover:text-emerald-700"
                        : "text-trego-restaurante hover:opacity-80"
                      : "invisible pointer-events-none"
                  }`}
                  aria-label={
                    !restauranteAbierto
                      ? undefined
                      : isEditing
                        ? "Guardar hora"
                        : "Editar hora de cierre"
                  }
                  disabled={!restauranteAbierto}
                >
                  {isEditing ? <Check size={32} /> : <Edit size={32} />}
                </button>
              </div>
            </div>
            {restauranteAbierto && (
              <div className="flex flex-row w-full gap-2 px-3 py-2 items-center">
                <div className="w-full">
                  <DateTimeInput
                    ref={cierreProgRef}
                    mode="datetime-local"
                    label="Cierre programado"
                    onChange={handleCierreProgChange}
                    value={internalCierreProg}
                    disabled={!isEditingCierreProg}
                    error={errorCierreProg ?? false}
                    className="text-sm px-1 py-1"
                  />
                </div>
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={
                      isEditingCierreProg
                        ? handleSaveCierreProg
                        : startEditCierreProg
                    }
                    className={`flex items-center justify-center transition-colors ${
                      isEditingCierreProg
                        ? "text-emerald-600 hover:text-emerald-700"
                        : "text-trego-restaurante hover:opacity-80"
                    }`}
                    aria-label={
                      isEditingCierreProg
                        ? "Guardar cierre programado"
                        : "Editar cierre programado"
                    }
                  >
                    {isEditingCierreProg ? (
                      <Check size={32} />
                    ) : (
                      <Edit size={32} />
                    )}
                  </button>
                </div>
              </div>
            )}
            <hr className="border-gray-100 my-1 mx-1" />
          </>
        )}

        {verPerfil ? (
          <button
            type="button"
            onClick={onVerPerfil}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-red-50 transition-colors"
          >
            <User size={32} className="text-gray-400 shrink-0" />
            <span className="flex-1 text-sm font-medium text-gray-800">
              Ver perfil
            </span>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </button>
        ) : undefined}

        {cambiarContrasenia ? (
          <button
            type="button"
            onClick={onCambiarContrasenia}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-red-50 transition-colors"
          >
            <Key size={32} className="text-gray-400 shrink-0" />
            <span className="flex-1 text-sm font-medium text-gray-800">
              Cambiar Contraseña
            </span>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </button>
        ) : undefined}

        <hr className="border-gray-100 my-1 mx-1" />

        {verHistorial ? (
          <button
            type="button"
            onClick={onChangeHistorial}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-red-50 transition-colors"
          >
            <ClipboardClock size={32} className="text-gray-400 shrink-0" />
            <span className="text-sm font-medium text-gray-800">
              Mis Pedidos
            </span>
          </button>
        ) : undefined}

        {/* Cerrar sesión */}
        <button
          type="button"
          onClick={onCerrarSesion}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-red-50 transition-colors"
        >
          <LogOut size={32} className="text-gray-400 shrink-0" />
          <span className="text-sm font-medium text-gray-800">
            Cerrar sesión
          </span>
        </button>
      </div>
    </div>
  );
}

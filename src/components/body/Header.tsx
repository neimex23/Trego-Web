import React, { useState, type ReactNode } from "react";
import tregoLogo from "../../assets/tregoicon.svg";
import tregoRestaurante from "../../assets/tregoIconRestaurante.svg";
import tregoAdmin from "../../assets/tregoAdminCircular.svg";
import { IconCart, IconMenu, IconSearch, IconUser } from "../icons.jsx";
import { useNavigate } from "react-router";
import MenuUsuario from "./MenuUsuario.js";

interface HeaderProps {
  busqueda?: string;
  onBusquedaChange?: (value: string) => void;
  onBuscar?: () => void;
  onAbrirFiltros?: () => void;
  tipoUser?: "Cliente" | "Restaurante" | "Administrador";
  children?: ReactNode;
  onToggleRestauranteAbierto?: (
    horaCierre?: string,
    horaApertura?: string,
  ) => void;
  restauranteAbierto?: boolean;
  horaCierre?: string | undefined;
  onChangeHoraCierre?: (item: string | undefined) => void;
  horaApertura?: string | undefined;
  onChangeHoraApertura?: (item: string | undefined) => void;
  cierreProgramado?: string | undefined;
  onChangeCierreProgramado?: (item: string) => void;
  onAbrirMenuNavegacion?: () => void;
  onLogout?: () => void;
  perfilNombre?: string;
  perfilEmail?: string;
  onVerPerfil?: () => void;
  cantidadTotal?: number;
  onAbrirCarrito?: () => void;
  noMostrarbuscador?: boolean;
  navigateTo?: string;
  onCambiarContraseña?: () => void;
  verPerfil?: boolean;
  cambiarContrasenia?: boolean;
  verHistorial?: boolean;
  onChangeHistorial?: () => void;
  menuUser?: boolean;
  placeholder?: string;
  ocultarBotonFiltros?: boolean;
  fotoPerfil?: string | undefined;
}

export default function Header(props: HeaderProps) {
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const {
    busqueda,
    onBusquedaChange,
    onBuscar,
    onAbrirFiltros,
    tipoUser = "Cliente",
    children,
    onToggleRestauranteAbierto,
    restauranteAbierto,
    horaCierre,
    onChangeHoraCierre,
    onLogout,
    perfilNombre,
    perfilEmail,
    onVerPerfil,
    cantidadTotal,
    onAbrirCarrito,
    noMostrarbuscador,
    navigateTo,
    horaApertura,
    onChangeHoraApertura,
    cierreProgramado,
    onChangeCierreProgramado,
    onAbrirMenuNavegacion,
    onCambiarContraseña,
    verHistorial,
    verPerfil,
    cambiarContrasenia,
    onChangeHistorial,
    menuUser = true,
    ocultarBotonFiltros,
    placeholder,
    fotoPerfil,
  } = props;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onBuscar?.();
  };

  const gradientesPorTipo: Record<string, string> = {
    Cliente: "from-orange-600 to-trego-orange",
    Restaurante: "from-emerald-500 to-trego-restaurante",
    Administrador: "from-violet-500 to-trego-admin",
  };

  const gradiente =
    gradientesPorTipo[tipoUser ?? ""] ?? "from-orange-400 to-trego-orange";

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="flex items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {onAbrirMenuNavegacion && (
            <button
              type="button"
              onClick={onAbrirMenuNavegacion}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 md:hidden"
              aria-label="Abrir menú de navegación"
            >
              <IconMenu className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => navigate(navigateTo ?? "/")}
            className="shrink-0 cursor-pointer transition-transform hover:scale-105"
          >
            <img
              src={
                tipoUser == "Cliente"
                  ? tregoLogo
                  : tipoUser == "Restaurante"
                    ? tregoRestaurante
                    : tregoAdmin
              }
              alt="Trego"
              className="h-11 w-11 sm:h-13 sm:w-13 scale-110 sm:scale-120"
            />
          </button>
        </div>

        {onBuscar &&
          noMostrarbuscador && ( // Para poder reutilizar el header en otro componente ponemos como opcional todo el
            // formulario que no necesitamos en iniciar sesion por ejemplo
            <form
              onSubmit={handleSubmit}
              className="flex min-w-0 flex-1 justify-center"
            >
              <div className="flex h-11 items-center w-130 overflow-hidden rounded-full border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:h-12">
                {!ocultarBotonFiltros && (
                  <button
                    type="button"
                    onClick={onAbrirFiltros}
                    className="flex h-full w-11 shrink-0 items-center justify-center text-gray-700 hover:bg-gray-50"
                    aria-label="Aplicar filtros"
                  >
                    <IconMenu className="h-5 w-5" />
                  </button>
                )}
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => onBusquedaChange?.(e.target.value)}
                  placeholder={placeholder ?? "Buscar producto o restaurante"}
                  className={`min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-500 ${ocultarBotonFiltros ? "px-6" : "px-2"}`}
                />
                <button
                  type="submit"
                  className="flex h-full w-11 shrink-0 items-center justify-center text-gray-600 hover:bg-gray-50"
                  aria-label="Buscar"
                >
                  <IconSearch className="h-5 w-5" />
                </button>
              </div>
            </form>
          )}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 ml-auto">
          {onAbrirFiltros && (
            <button
              type="button"
              onClick={onAbrirCarrito}
              className="
                          relative flex h-10 w-10 sm:h-11 sm:w-11
                          items-center justify-center
                          rounded-full cursor-pointer
                          bg-gradient-to-br from-orange-500 to-trego-cart
                          ring-2 ring-white shadow-md
                          transition-transform hover:scale-110 active:scale-95
                        "
              aria-label="Carrito"
            >
              <IconCart className="h-6 w-6 text-white" />

              {(cantidadTotal ?? 0) > 0 && (
                <span
                  className="
                            absolute -right-1 -top-1
                            flex h-5 min-w-5 items-center justify-center
                            rounded-full bg-red-700
                            px-1 text-[12px] font-bold text-white
                            ring-2 ring-white           
                          "
                >
                  {cantidadTotal && cantidadTotal > 99 ? "99+" : cantidadTotal}
                </span>
              )}
            </button>
          )}
          {/**Aca podemos colocar el boton que quieramos, ejemplo el de registrar usuario, etc */}
          {children}

          {menuUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuAbierto(!menuAbierto)}
                className={`flex h-10 w-10 sm:h-11 sm:w-11
                            items-center justify-center
                            rounded-full cursor-pointer
                            bg-gradient-to-br ${gradiente}
                            ring-2 ring-white shadow-md
                            transition-transform hover:scale-115 active:scale-95
                          `}
                aria-label="Perfil"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6 text-white" // ← de h-5 w-5 a h-6 w-6
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-3.87 3.58-7 8-7s8 3.13 8 7" />
                </svg>
              </button>

              {/* Capa invisible para cerrar el menú si se hace clic fuera */}
              {menuAbierto && (
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuAbierto(false)}
                />
              )}

              {/* Pequeño menú modal flotante */}
              {menuAbierto && (
                <>
                  <MenuUsuario
                    avatarUrl={fotoPerfil ?? ""}
                    nombre={perfilNombre ?? "Usuario"}
                    email={perfilEmail ?? ""}
                    tipoUser={tipoUser}
                    onVerPerfil={() => {
                      setMenuAbierto(false);
                      onVerPerfil?.();
                    }}
                    onCerrarSesion={() => onLogout?.()}
                    onToggleRestaurante={(horaCierre, horaApertura) =>
                      onToggleRestauranteAbierto?.(horaCierre, horaApertura)
                    }
                    restauranteAbierto={restauranteAbierto}
                    horaCierre={horaCierre}
                    onChangeHoraCierre={onChangeHoraCierre}
                    horaApertura={horaApertura}
                    onChangeHoraApertura={onChangeHoraApertura}
                    cierreProgramado={cierreProgramado}
                    onChangeCierreProgramado={onChangeCierreProgramado}
                    onCambiarContrasenia={() => {
                      setMenuAbierto(false);
                      onCambiarContraseña?.();
                    }}
                    verHistorial={verHistorial ?? false}
                    verPerfil={verPerfil ?? false}
                    cambiarContrasenia={cambiarContrasenia ?? false}
                    onChangeHistorial={() => onChangeHistorial?.()}
                  />
                </>
              )}
            </div>
          ) : undefined}
        </div>
      </div>
      <div
        className={`h-0.5 ${tipoUser == "Cliente" ? "bg-trego-orange" : `${tipoUser == "Restaurante" ? "bg-trego-restaurante" : "bg-trego-admin"}`}`}
      />
    </header>
  );
}

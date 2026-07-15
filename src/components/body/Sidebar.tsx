import { NavLink } from "react-router";
import { X } from "lucide-react";
import TextoDivider from "../../components/TextoDivider.js";
import type { SidebarSection } from "./utilities/DataSidebar.js";

interface SidebarProps {
  secciones: SidebarSection[];
  tipoUser: "Restaurante" | "Administrador";
  mobileOpen?: boolean;
  onCloseMobile: () => void;
}

function SidebarNav({
  secciones,
  tipoUser,
  onNavigate,
}: {
  secciones: SidebarSection[];
  tipoUser: "Restaurante" | "Administrador";
  onNavigate?: () => void;
}) {
  const colorClass =
    tipoUser === "Administrador" ? "trego-admin" : "trego-restaurante";

  return (
    <>
      {secciones.map(({ section, items }) => (
        <div key={section} className="flex flex-col gap-1">
          <TextoDivider
            texto={section}
            classNameTexto={`font-bold text-${colorClass}`}
            classNameDivider={`bg-${colorClass}`}
          />
          <div className="flex flex-col gap-0.5 mt-2">
            {items.map((item) => {
              if (item.disabled) {
                return (
                  <span
                    key={item.label}
                    className="w-full text-left text-sm px-4 py-2.5 rounded-xl text-gray-400 cursor-not-allowed select-none"
                    title="Próximamente"
                  >
                    {item.label}
                  </span>
                );
              }

              return (
                <NavLink
                  key={item.label}
                  to={item.path!}
                  end={item.end ?? false}
                  onClick={onNavigate}
                  className={({ isActive }) => `
                    w-full text-left text-sm px-4 py-2.5 rounded-xl transition-colors duration-150
                    flex items-center justify-between gap-2
                    ${
                      isActive
                        ? `bg-${colorClass} text-white font-semibold shadow-sm`
                        : `text-gray-600 hover:bg-${tipoUser === "Administrador" ? "blue" : "green"}-50 hover:text-${colorClass}`
                    }
                  `}
                >
                  <span>{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span
                      className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs font-bold ${
                        item.disabled
                          ? "bg-white/20 text-white"
                          : `bg-trego-orange text-white`
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export default function Sidebar({
  secciones,
  tipoUser = "Restaurante",
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const colorClass =
    tipoUser === "Administrador" ? "trego-admin" : "trego-restaurante";

  return (
    <>
      <aside
        className={`hidden md:flex flex-col w-64 shrink-0 min-h-0 h-full overflow-y-auto border-r border-${colorClass} bg-white pt-8 px-4 pb-6 gap-6`}
      >
        <SidebarNav secciones={secciones} tipoUser={tipoUser} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar menú"
            onClick={onCloseMobile}
          />
          <aside
            className={`relative flex h-full w-[min(18rem,calc(100vw-3rem))] flex-col overflow-y-auto border-r border-${colorClass} bg-white px-4 pb-6 pt-4 shadow-xl`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">Menú</span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-6">
              <SidebarNav
                secciones={secciones}
                tipoUser={tipoUser}
                onNavigate={onCloseMobile}

              />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

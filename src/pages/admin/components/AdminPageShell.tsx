import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

export const ADMIN_PAGE_CLASS =
  "flex-1 w-full min-h-0 min-w-0 p-3 sm:p-4 md:p-8 overflow-y-auto overflow-x-hidden bg-gray-50 text-gray-800 font-sans";

interface AdminPageHeaderProps {
  titulo: string;
  descripcion?: string;
  centrado?: boolean;
  onRecargar?: () => void;
  recargando?: boolean;
}

export function AdminPageHeader({
  titulo,
  descripcion,
  centrado = false,
  onRecargar,
  recargando = false,
}: AdminPageHeaderProps) {
  return (
    <div
      className={`mb-5 sm:mb-8 ${
        centrado ? "text-center" : ""
      } ${onRecargar ? "flex items-start justify-between gap-3" : ""}`}
    >
      {onRecargar ? (
        <>
          <div className="w-9 shrink-0 sm:w-10" aria-hidden />
          <div className="min-w-0 flex-1">
            <h1 className="text-center text-lg sm:text-3xl font-bold text-gray-900 leading-tight">
              {titulo}
            </h1>
            {descripcion && (
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500">
                {descripcion}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onRecargar}
            disabled={recargando}
            className={`shrink-0 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-trego-admin hover:opacity-80 transition-colors ${
              recargando ? "animate-spin opacity-60 cursor-wait" : ""
            }`}
            aria-label="Recargar"
          >
            <RefreshCw className="h-7 w-7 sm:h-8 sm:w-8" />
          </button>
        </>
      ) : (
        <>
          <h1
            className={`text-lg sm:text-3xl font-bold text-gray-900 leading-tight ${
              centrado ? "" : ""
            }`}
          >
            {titulo}
          </h1>
          {descripcion && (
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500">
              {descripcion}
            </p>
          )}
        </>
      )}
    </div>
  );
}

interface AdminPageShellProps {
  children: ReactNode;
  className?: string;
}

export default function AdminPageShell({
  children,
  className = "",
}: AdminPageShellProps) {
  return (
    <div className={`${ADMIN_PAGE_CLASS} ${className}`.trim()}>{children}</div>
  );
}

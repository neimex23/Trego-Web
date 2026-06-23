import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

export const RESTAURANTE_PAGE_CLASS =
  "flex-1 w-full min-h-0 min-w-0 p-3 sm:p-4 md:p-8 overflow-y-auto overflow-x-hidden bg-gray-50 text-gray-800 font-sans";

interface RestaurantePageHeaderProps {
  titulo: string;
  onRecargar?: () => void;
  recargando?: boolean;
}

export function RestaurantePageHeader({
  titulo,
  onRecargar,
  recargando = false,
}: RestaurantePageHeaderProps) {
  return (
    <div className="mb-5 sm:mb-6 flex items-center justify-between gap-3">
      <div className="w-9 shrink-0 sm:w-10" aria-hidden={!!onRecargar} />
      <h1 className="flex-1 text-center text-lg sm:text-2xl font-black text-gray-800 uppercase tracking-tight leading-tight">
        {titulo}
      </h1>
      {onRecargar ? (
        <button
          type="button"
          onClick={onRecargar}
          disabled={recargando}
          className={`shrink-0 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-trego-restaurante hover:opacity-80 transition-colors ${
            recargando ? "animate-spin opacity-60 cursor-wait" : ""
          }`}
          aria-label="Recargar"
        >
          <RefreshCw className="h-7 w-7 sm:h-8 sm:w-8" />
        </button>
      ) : (
        <div className="w-9 shrink-0 sm:w-10" aria-hidden />
      )}
    </div>
  );
}

interface RestaurantePageShellProps {
  children: ReactNode;
  className?: string;
}

export default function RestaurantePageShell({
  children,
  className = "",
}: RestaurantePageShellProps) {
  return (
    <div className={`${RESTAURANTE_PAGE_CLASS} ${className}`.trim()}>
      {children}
    </div>
  );
}

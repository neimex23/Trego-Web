import { useState, useRef, useEffect } from "react";
import type { DireccionGeoapify } from "../data/DireccionGeoapify.js";
import { buscarDireccionesGeoapify } from "../pages/restaurantes/utilitis/geoapifyUtilitis.js";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconX = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconPin = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────
interface DireccionAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress: (direccion: DireccionGeoapify) => void;
  onClear?: () => void;
  error?: string;
  className?: string;
  classNameLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DireccionAutocomplete({
  label = "Dirección",
  placeholder = "Ej: Av 8 de Octubre 2020",
  value,
  onChangeText,
  onSelectAddress,
  onClear,
  error,
  className,
  classNameLabel,
}: DireccionAutocompleteProps) {
  const [sugerencias, setSugerencias] = useState<DireccionGeoapify[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showNoResults, setShowNoResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // ── Cerrar al hacer click afuera ──────────────────────────────────────────
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowNoResults(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // ── Escritura con debounce ────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChangeText(text);
    setActiveIndex(-1);
    setShowNoResults(false);
    setSearchError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (text.trim().length < 3) {
      setSugerencias([]);
      setIsOpen(false);
      return;
    }

    // 400ms para no hacer una petición por cada tecla
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      abortControllerRef.current = new AbortController();
      try {
        const resultados = await buscarDireccionesGeoapify(
          text,
          abortControllerRef.current.signal,
        );
        setSugerencias(resultados);
        setIsOpen(resultados.length > 0);
        setShowNoResults(resultados.length === 0);
      } catch (err: any) {
        if (err.name === "AbortError") {
          return;
        }
        console.error("Error buscando dirección:", err);
        setSugerencias([]);
        setIsOpen(false);
        setShowNoResults(false);
        setSearchError(
          "No se pudo buscar la dirección. Revisá que el backend esté corriendo.",
        );
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 400);
  };

  // ── Navegación con teclado ────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!isOpen || sugerencias.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, sugerencias.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const seleccion = sugerencias[activeIndex];
      if (seleccion) handleSelect(seleccion);
    }
  };

  // ── Seleccionar sugerencia ────────────────────────────────────────────────
  const handleSelect = (sug: DireccionGeoapify) => {
    // Mostrar en el input: "Calle 1234" (calle + número de puerta si existe)
    const textoDisplay = [sug.calle, sug.numero].filter(Boolean).join(" ");
    onChangeText(textoDisplay || sug.direccionCompleta);

    // El objeto completo tiene .numero con el número de puerta
    onSelectAddress(sug);

    setSugerencias([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setShowNoResults(false);
    setSearchError(null);
  };

  // ── Limpiar input ─────────────────────────────────────────────────────────
  const handleClear = () => {
    onChangeText("");
    onClear?.();
    setSugerencias([]);
    setIsOpen(false);
    setShowNoResults(false);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    inputRef.current?.focus();
  };

  const showDropdown =
    (isOpen || showNoResults) && !isSearching && value.trim().length >= 3;

  return (
    <div className="relative w-full flex flex-col " ref={wrapperRef}>
      {/* Label */}
      {label && (
        <label
          className={`text-sm font-semibold px-5 text-gray-700 ${classNameLabel}`}
        >
          {label}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        {/* Ícono lupa */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <IconSearch />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (sugerencias.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={`
            w-full border rounded-full h-12 py-3 pl-11 pr-10 outline-none
            transition-all duration-150 text-sm text-gray-800 placeholder-gray-400
            ${
              error
                ? "border-red-400 focus:ring-1 focus:ring-red-400 bg-red-50/30"
                : "border-gray-400 bg-white focus:border-trego-restaurante focus:ring-1 focus:ring-trego-restaurante"
            }
                ${className}
          `}
        />

        {/* Slot derecho: spinner o botón limpiar */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-gray-200 border-t-trego-restaurante rounded-full animate-spin" />
          ) : value ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()} // no perder el foco del input
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
              aria-label="Limpiar dirección"
            >
              <IconX />
            </button>
          ) : null}
        </div>
      </div>

      {/* Error de validación o búsqueda */}
      {(error || searchError) && (
        <span className="text-xs text-red-500 px-5 mt-1 block">
          {error || searchError}
        </span>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <ul className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-white border border-gray-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto">
          {sugerencias.length > 0 ? (
            sugerencias.map((sug, index) => (
              <li
                key={`${sug.calle}-${sug.numero}-${index}`}
                onMouseDown={(e) => e.preventDefault()} // evitar blur antes del click
                onClick={() => handleSelect(sug)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`
                  px-4 py-3 text-sm cursor-pointer
                  border-b border-gray-100 last:border-b-0
                  transition-colors duration-100
                  flex items-start gap-3
                  ${index === activeIndex ? "bg-green-50" : "hover:bg-gray-50"}
                `}
              >
                {/* Pin */}
                <span className="shrink-0 mt-0.5 text-gray-400">
                  <IconPin />
                </span>

                <div className="flex-1 min-w-0">
                  {/* Calle + Número de puerta */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 truncate">
                      {sug.calle}
                      {sug.numero && (
                        <span className="text-trego-restaurante">
                          {" "}
                          {sug.numero}
                        </span>
                      )}
                    </span>

                    {/* Badge número de puerta */}
                    {sug.numero && (
                      <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full leading-none">
                        Nro. {sug.numero}
                      </span>
                    )}
                  </div>

                  {/* Dirección completa */}
                  <span className="block text-xs text-gray-400 truncate mt-0.5">
                    {sug.direccionCompleta}
                  </span>
                </div>
              </li>
            ))
          ) : (
            /* Sin resultados */
            <li className="px-5 py-4 flex items-center justify-center gap-2 text-sm text-gray-400">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              No se encontraron resultados. Escribí al menos 3 letras y elegí
              una opción de la lista.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

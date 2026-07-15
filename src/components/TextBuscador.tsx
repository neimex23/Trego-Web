import React, { useState, useEffect, useRef, useMemo } from "react";

export interface SearchItem {
  id: string | number;
  label: string;
  dotClassName?: string;
}

interface TextSearchProps<T> {
  id?: string;
  items: T[];
  placeholder?: string;
  colorStyle?: string;
  onSelect: (item: T | undefined) => void;
  selected?: T | undefined;
  mapToItem: (item: T) => SearchItem;
  label?: boolean;
  error?: string;
  className?: string;
  classBox?: string;
}

const colorMap: Record<string, string> = {
  "trego-restaurante": "#fff3e0",
  "trego-cliente": "#e3f2fd",
  "blue-500": "#eff6ff",
  "green-500": "#f0fdf4",
  "red-500": "#fef2f2",
  "purple-500": "#faf5ff",
};

export const TextBuscador = <T,>({
  items,
  placeholder = "Buscar...",
  colorStyle = "trego-restaurante",
  onSelect,
  selected = undefined,
  mapToItem,
  label = false,
  error,
  className,
  id,
  classBox
}: TextSearchProps<T>) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownDir, setDropdownDir] = useState<"down" | "up">("down");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedMapped = useMemo(() => {
    if (!selected) return undefined;
    const mapped = mapToItem(selected);
    const existsInList = items.some((item) => mapToItem(item).id === mapped.id);
    return existsInList ? mapped : undefined;
  }, [selected, items, mapToItem]);

  const hasValidSelection = !!(selected && selectedMapped);

  const showAllItems = query.length === 0 || (hasValidSelection && query === selectedMapped?.label);
  
  const filtered = showAllItems
    ? items
    : items.filter((item) =>
        mapToItem(item).label.toLowerCase().includes(query.toLowerCase())
      );

  const isFloating = isFocused || query.length > 0 || hasValidSelection;
  const hoverBg = colorMap[colorStyle] ?? "#f3f4f6";

  // ── Effects ───────────────────────────────────────────────────────────────

useEffect(() => {
    // Si desde el padre se eliminó la selección (ej. lo quitaron de la lista)
    if (selected === undefined) {
      setQuery("");
    } 
    // Si hay selección pero ya no existe en la lista de items
    else if (selected && !selectedMapped) {
      onSelect(undefined);
      setQuery("");
    }
  }, [selected, selectedMapped, onSelect]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openDropdown = () => {
    const rect = inputRef.current?.getBoundingClientRect();
    if (rect) {
      setDropdownDir(window.innerHeight - rect.bottom < 220 ? "up" : "down");
    }
    setIsOpen(true);
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setQuery(mapToItem(item).label);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(undefined);
    setQuery("");
    setIsOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={wrapperRef} className={`relative w-full ${classBox}`}>
      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={hasValidSelection && !isFocused ? selectedMapped!.label : query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (hasValidSelection) onSelect(undefined);
            openDropdown();
          }}
          onFocus={() => {
            setIsFocused(true);
            if (hasValidSelection) {
              setQuery(selectedMapped!.label);
            }
            openDropdown();
          }}
          onBlur={() => setIsFocused(false)}
          placeholder=""
          className={`
            peer w-full h-12 border rounded-full px-5 pr-10
            outline-none transition-all duration-200 cursor-text
            ${error ? "border-red-400" : "border-gray-400"}
            focus:border-${colorStyle} focus:ring-1 focus:ring-${colorStyle}
            text-gray-700 ${classBox}
          `}
        />

        {/* Floating label */}
        {label ? (
          <label
            className={`
              absolute left-5 transition-all duration-200 pointer-events-none
              ${
                isFloating
                  ? `-top-2 text-xs px-1 ${
                      error
                        ? "text-red-500 bg-red-50"
                        : `text-${colorStyle} bg-white`
                    }`
                  : "top-3.5 text-base text-gray-500"
              }
              ${className ?? ""}
            `}
          >
            {placeholder}
          </label>
        ) : (
          <label
            className={`
              absolute left-5 transition-all duration-200 pointer-events-none
              top-3.5 text-base
              ${isFloating ? "text-transparent" : "text-gray-500"}
              ${className ?? ""}
            `}
          >
            {placeholder}
          </label>
        )}

        {/* Ícono limpiar / buscar */}
        <div className="absolute right-4 inset-y-0 flex items-center">
          {hasValidSelection ? (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleClear();
              }}
              className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Limpiar selección"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                inputRef.current?.focus();
                openDropdown();
              }}
              className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Buscar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Dropdown ──────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`
            absolute left-0 right-0 z-50
            bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden
            ${
              dropdownDir === "up"
                ? "bottom-[calc(100%+6px)]"
                : "top-[calc(100%+6px)]"
            }
          `}
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400 text-center">
              Sin resultados
            </p>
          ) : (
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.map((item) => {
                const mapped = mapToItem(item);
                const isSelected = selectedMapped?.id === mapped.id;
                return (
                  <li
                    key={mapped.id}
                    onMouseDown={(e) => {
                      e.preventDefault(); 
                      handleSelect(item);
                    }}
                    className={`
                      px-4 py-3 text-sm cursor-pointer transition-colors
                      border-b border-gray-100 last:border-b-0
                      ${
                        isSelected
                          ? `text-${colorStyle} font-semibold bg-gray-50`
                          : "text-gray-700"
                      }
                    `}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "";
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          mapped.dotClassName ?? `bg-${colorStyle}`
                        }`}
                      />
                      <span>{mapped.label}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
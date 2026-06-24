import React, { forwardRef } from "react";

interface DateTimeInputProps {
  /** 'time' para hora, 'date' para fecha, 'datetime-local' para fecha y hora. Por defecto es 'time' */
  mode?: "time" | "date" | "datetime-local";
  /** Valor controlado (Formato 'HH:mm', 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm') */
  value: string;
  /** Callback cuando cambia el valor */
  onChange: (value: string) => void;
  /** Etiqueta flotante */
  label?: string;
  /** Deshabilitar el campo */
  disabled?: boolean;
  /** Mensaje de error o indicador booleano de que hay un error */
  error?: string | boolean;
  /** Clases extra para el input (sobrescriben estilos base) */
  className?: string;
}

export const DateTimeInput = forwardRef<HTMLInputElement, DateTimeInputProps>(
  (
    {
      mode = "time",
      value,
      onChange,
      label = mode === "time" ? "Hora" : "Fecha",
      disabled = false,
      error,
      className,
    },
    ref,
  ) => {
    // Evaluamos si hay error para aplicar las clases rojas
    const hasError = Boolean(error);

    return (
      <div className="relative inline-flex flex-col w-full max-w-75 mt-2 font-sans">
        <div className="relative inline-flex w-full">
          <input
            ref={ref}
            type={mode}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder=""
            className={`
              peer w-full px-4 pl-6 py-2.5 text-base bg-transparent 
              rounded-xl outline-none transition-all scheme-light
              disabled:border-[#1C1B1F]/12 disabled:text-[#1C1B1F]/38 disabled:cursor-not-allowed
              ${
                hasError
                  ? /* Clases con Error */
                    "border border-[#B3261E] text-[#1D1B20] focus:border-2 focus:border-[#B3261E] focus:px-3.75 focus:py-2.25"
                  : /* Clases Normales (Tus clases originales) */
                    "border border-[#79747E] text-[#1D1B20] focus:border-2 focus:border-[#6750A4] focus:px-3.75 focus:py-2.25"
              }
              ${className ?? ""}
            `}
          />

          <label
            className={`
              absolute left-3 -top-2 px-1 text-xs font-medium bg-white 
              pointer-events-none transition-all
              peer-disabled:text-[#1C1B1F]/38
              ${
                hasError
                  ? "text-[#B3261E] peer-focus:text-[#B3261E]"
                  : "text-[#49454F] peer-focus:text-[#6750A4]"
              }
            `}
          >
            {label}
          </label>
        </div>

        {/* Muestra el texto del error debajo del input si pasaste un string */}
        {typeof error === "string" && error && (
          <span className="text-xs text-[#B3261E] mt-1 ml-4">{error}</span>
        )}
      </div>
    );
  },
);

// Muestra el nombre correcto en las React DevTools
DateTimeInput.displayName = "DateTimeInput";

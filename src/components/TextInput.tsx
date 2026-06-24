import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

interface InputProps {
  id?: string;
  placeholder: string;
  type?: "text" | "password" | "email";
  className?: string;
  value: string;
  onChange: (value: string) => void;
  colorStyle?: string; // color que tenfra los outlained y el texto del label flotante
  label?: boolean;
  showStrength?: boolean;
  onChangeSeguridad?: (value: SeguridadPassword) => void;
  error?: string;
  onEnter?: () => void;
}
export type SeguridadPassword = "Debil" | "Regular" | "Buena" | "Fuerte";

function getPasswordStrength(password: string): {
  level: 0 | 1 | 2 | 3 | 4;
  label: SeguridadPassword;
  color: string;
} {
  if (!password) return { level: 0, label: "Debil", color: "" };

  let score = 0;
  //Guardamos en una variable si tiene al menos un número
  const hasNumber = /[0-9]/.test(password);

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (hasNumber) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;

  // 3. LA MAGIA: Si no tiene número, el puntaje máximo permitido es 2 (Regular)
  if (!hasNumber && score > 2) {
    score = 2;
  }

  if (score <= 1) return { level: 1, label: "Debil", color: "text-red-500" };
  if (score <= 2)
    return { level: 2, label: "Regular", color: "text-amber-500" };
  if (score <= 3) return { level: 3, label: "Buena", color: "text-purple-500" };
  return { level: 4, label: "Fuerte", color: "text-emerald-600" };
}

const BAR_COLORS: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-amber-500",
  3: "bg-purple-500",
  4: "bg-emerald-600",
};

export const TextInput = ({
  placeholder,
  type = "text",
  className,
  value,
  onChange,
  colorStyle = "trego-orange",
  label = true,
  showStrength = false,
  onChangeSeguridad,
  error,
  id,
  onEnter,
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isFloating = isFocused || value.length > 0;

  // Determinamos el tipo real del input
  const inputType = type === "password" && showPassword ? "text" : type;

  // Solo calculamos si aplica
  const strength =
    type === "password" && showStrength ? getPasswordStrength(value) : null;

  useEffect(() => {
    if (onChangeSeguridad) {
      onChangeSeguridad(strength?.label ?? "Debil");
    }
  }, [onChangeSeguridad, strength?.label, value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <input
        id={id}
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className={`peer w-full h-12 border rounded-full px-5 outline-none
                    focus:ring-1 transition-all duration-200 placeholder-transparent
                    ${
                      error
                        ? "border-red-400 focus:border-red-400 focus:ring-red-300 bg-red-50"
                        : `border-gray-400 focus:border-${colorStyle} focus:ring-${colorStyle} bg-white`
                    }
                    ${className}`}
        placeholder={placeholder}
      />
      {label ? (
        <label
          className={`absolute left-5 transition-all duration-200 pointer-events-none 
                    ${
                      isFloating
                        ? `-top-2 text-xs px-1 ${
                            error
                              ? "text-red-500 bg-red-50"
                              : `text-${colorStyle} bg-white`
                          }`
                        : "top-3.5 text-base text-gray-500"
                    } ${className}`}
        >
          {placeholder}
        </label>
      ) : (
        <label
          className={`absolute left-5 transition-all duration-200 pointer-events-none top-3.5 text-base  ${isFloating ? "text-transparent" : "text-gray-500"} ${className}`}
        >
          {placeholder}
        </label>
      )}

      {/* Solo mostramos el botón si el tipo es 'password' */}
      {type === "password" && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={`absolute right-5 top-4 flex items-center justify-center text-gray-500
           hover:text-trego-orange transition-colors ${className}`}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}

      {type === "password" && showStrength && (
        <div className="mt-2 px-1">
          <div className="flex gap-1.5 mb-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  strength && i <= strength.level
                    ? BAR_COLORS[strength.level]
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div
            className="flex justify-between transition-opacity duration-200"
            style={{ opacity: strength && strength.level > 0 ? 1 : 0 }}
          >
            <span className="text-xs text-gray-400">Seguridad</span>
            <span className={`text-xs font-medium ${strength?.color ?? ""}`}>
              {strength?.label ?? ""}
            </span>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1 px-5">{error}</p>}
    </div>
  );
};

import { OPCIONES_ORDEN } from '../utils/filtrosRestaurantes.js'

export default function OrdenamientoSelect({ value, onChange, className = '' }) {
  return (
    <label
      className={`flex w-full min-w-0 flex-col gap-1.5 text-[12px] text-gray-600 sm:inline-flex sm:w-auto sm:flex-row sm:items-center sm:gap-2 ${className}`}
    >
      <span className="font-medium sm:whitespace-nowrap">Ordenar:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-2 text-[12px] font-medium text-gray-800 outline-none focus:border-trego-orange sm:w-auto sm:py-1.5"
      >
        {OPCIONES_ORDEN.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function EmptyState({ mensaje = 'No hay nada para mostrar', onLimpiarFiltros }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 px-4 py-12 text-center sm:px-6 sm:py-16">
      <p className="text-base font-medium text-gray-600 sm:text-lg">{mensaje}</p>
      {onLimpiarFiltros && (
        <button
          type="button"
          onClick={onLimpiarFiltros}
          className="mt-4 rounded-xl bg-trego-orange px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

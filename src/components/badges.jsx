import { IconTag } from './icons'

export function BadgeAbierto({ abierto = true, texto }) {
  const label = texto ?? (abierto ? 'Abierto' : 'Cerrado')
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-800">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${abierto ? 'bg-emerald-500' : 'bg-gray-500'}`}
      />
      {label}
    </span>
  )
}

export function BadgeOfertas() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-trego-orange px-2.5 py-1 text-[11px] font-semibold text-white">
      <IconTag className="h-3 w-3 text-gray-900" />
      Ofertas
    </span>
  )
}

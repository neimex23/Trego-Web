export default function SectionRow({ titulo, children, accion }) {
  return (
    <section className="mb-6 sm:mb-7">
      <header className="mb-3 flex flex-col gap-2 px-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="text-base font-bold text-gray-900 sm:text-[17px]">{titulo}</h2>
        {accion}
      </header>
      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-1 pb-2 [scrollbar-gutter:stable]">
        {children}
      </div>
    </section>
  )
}

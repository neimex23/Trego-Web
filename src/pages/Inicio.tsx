import { useNavigate } from "react-router";
import Header from "../components/body/Header.js";
import bolsaTrego from "../assets/bolsa-trego.svg";
import tregoCliente from "../assets/tregoCliente.svg";
import tregoRestaurante from "../assets/tregoRestaurante.svg";
import tregoAdmin from "../assets/tregoAdminy.svg";

const perfiles = [
  {
    titulo: "Clientes",
    descripcion:
      "Explorá los locales cercanos, armá tu pedido y seguí el estado en tiempo real hasta tu puerta.",
    icon: tregoCliente,
    acento: "text-orange-600",
    iconBg: "bg-orange-100",
    barra: "bg-trego-orange",
  },
  {
    titulo: "Restaurantes",
    descripcion:
      "Gestioná tu menú, promociones y pedidos, y controlá tus ventas con estadísticas claras.",
    icon: tregoRestaurante,
    acento: "text-emerald-600",
    iconBg: "bg-emerald-100",
    barra: "bg-trego-restaurante",
  },
  {
    titulo: "Administradores",
    descripcion:
      "Aprobá locales, moderá la plataforma y mantené todo funcionando desde un panel central.",
    icon: tregoAdmin,
    acento: "text-sky-600",
    iconBg: "bg-sky-100",
    barra: "bg-trego-admin",
  },
];


const integrantes = [
  "Alexis La Cruz",
  "Ezequiel Medina",
  "Maikol Brion",
  "Dámaso Tor",
  "Horacio Duarte",
  "Nicolás Fernández",
  "Cristian González",
  "Mateo Sparano",
];

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Momentos: escenas ficticias ilustradas (SVG a medida) ──────────────────

// Cena en familia alrededor de la mesa
function EscenaFamilia() {
  return (
    <svg viewBox="0 0 240 170" className="h-full w-full" role="img" aria-label="Cena en familia">
      <rect width="240" height="170" fill="#fff3e6" />
      <circle cx="120" cy="55" r="42" fill="#ffe0bd" opacity="0.6" />
      {/* corazón */}
      <path d="M120 26c3-6 13-5 13 3 0 6-8 10-13 14-5-4-13-8-13-14 0-8 10-9 13-3z" fill="#ff7700" opacity="0.85" />
      {/* persona izquierda */}
      <g>
        <path d="M58 150v-24c0-15 24-15 24 0v24z" fill="#0fab4d" />
        <circle cx="70" cy="98" r="15" fill="#f2c9a0" />
        <path d="M56 92a14 14 0 0 1 28 0z" fill="#5a3921" />
        <path d="M64 100q6 5 12 0" stroke="#5a3921" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {/* persona derecha */}
      <g>
        <path d="M158 150v-24c0-15 24-15 24 0v24z" fill="#476dd4" />
        <circle cx="170" cy="98" r="15" fill="#e0a878" />
        <path d="M156 94a14 14 0 0 1 28 0l-2 4h-24z" fill="#3a2416" />
        <path d="M164 100q6 5 12 0" stroke="#3a2416" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {/* mesa */}
      <rect x="40" y="128" width="160" height="14" rx="7" fill="#a65a2a" />
      <rect x="40" y="140" width="160" height="30" fill="#8d4f24" />
      {/* platos y comida */}
      <ellipse cx="85" cy="128" rx="18" ry="5" fill="#ffffff" />
      <circle cx="85" cy="126" r="7" fill="#ff7700" />
      <ellipse cx="155" cy="128" rx="18" ry="5" fill="#ffffff" />
      <circle cx="155" cy="126" r="7" fill="#0fab4d" />
      {/* vapor */}
      <path d="M120 118c-3-4 3-7 0-11" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

// Delivery llegando a la puerta con la bolsa de Trego
function EscenaDelivery() {
  return (
    <svg viewBox="0 0 240 170" className="h-full w-full" role="img" aria-label="Pedido llegando a casa">
      <rect width="240" height="170" fill="#e9f7ef" />
      {/* puerta */}
      <rect x="150" y="40" width="70" height="130" rx="4" fill="#c9a27a" />
      <rect x="160" y="52" width="50" height="118" rx="3" fill="#b98a5c" />
      <circle cx="166" cy="112" r="3" fill="#5a3921" />
      {/* repartidor */}
      <g>
        <path d="M52 168v-40c0-16 30-16 30 0v40z" fill="#ff7700" />
        <circle cx="67" cy="90" r="16" fill="#f2c9a0" />
        <path d="M50 88a17 12 0 0 1 34 0z" fill="#ff7700" />
        <rect x="49" y="84" width="36" height="6" rx="3" fill="#e56a00" />
        <path d="M60 94q7 5 14 0" stroke="#5a3921" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {/* bolsa Trego */}
      <g>
        <rect x="92" y="112" width="34" height="40" rx="5" fill="#ff7700" />
        <rect x="99" y="105" width="8" height="12" rx="4" fill="#e56a00" />
        <rect x="111" y="105" width="8" height="12" rx="4" fill="#e56a00" />
        <circle cx="109" cy="134" r="10" fill="#ffffff" />
        <path d="M104 134l3 3 6-6" stroke="#ff7700" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* líneas de movimiento */}
      <path d="M30 120h16M26 132h20" stroke="#0fab4d" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// Noche de peli en el sillón
function EscenaSillon() {
  return (
    <svg viewBox="0 0 240 170" className="h-full w-full" role="img" aria-label="Noche de película con comida">
      <rect width="240" height="170" fill="#fdeef0" />
      {/* tele */}
      <rect x="150" y="30" width="66" height="44" rx="4" fill="#1e3a5f" />
      <rect x="156" y="36" width="54" height="32" rx="2" fill="#476dd4" opacity="0.7" />
      <rect x="176" y="74" width="14" height="8" fill="#1e3a5f" />
      <path d="M132 40l14 6M132 52h16M132 64l14-6" stroke="#f6c453" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      {/* sillón */}
      <rect x="28" y="120" width="120" height="40" rx="10" fill="#e5533d" />
      <rect x="20" y="108" width="24" height="52" rx="10" fill="#cf4630" />
      {/* persona */}
      <g>
        <path d="M62 132v-18c0-14 26-14 26 0v18z" fill="#8d6e63" />
        <circle cx="75" cy="94" r="15" fill="#e0a878" />
        <path d="M61 90a14 14 0 0 1 28 0z" fill="#2e1c12" />
        <path d="M69 98q6 5 12 0" stroke="#2e1c12" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {/* porción de pizza */}
      <path d="M104 128l16-6 4 12z" fill="#ffcf6b" />
      <path d="M104 128l16-6 4 12z" fill="none" stroke="#e0a13c" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="113" cy="126" r="1.6" fill="#e5533d" />
      <circle cx="117" cy="131" r="1.6" fill="#e5533d" />
    </svg>
  );
}

// Desayuno / café por la mañana en la cocina
function EscenaCafe() {
  return (
    <svg viewBox="0 0 240 170" className="h-full w-full" role="img" aria-label="Desayuno feliz en casa">
      <rect width="240" height="170" fill="#f5f0e8" />
      <circle cx="120" cy="60" r="40" fill="#ffe9c7" opacity="0.7" />
      {/* ventana */}
      <rect x="150" y="24" width="60" height="50" rx="4" fill="#cfe8f5" />
      <path d="M180 24v50M150 49h60" stroke="#ffffff" strokeWidth="3" />
      {/* persona */}
      <g>
        <path d="M56 168v-46c0-17 32-17 32 0v46z" fill="#ff7700" />
        <circle cx="72" cy="86" r="17" fill="#f2c9a0" />
        <path d="M55 82a17 13 0 0 1 34 0z" fill="#5a3921" />
        <path d="M64 90q8 6 16 0" stroke="#5a3921" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {/* barra */}
      <rect x="30" y="132" width="180" height="12" rx="4" fill="#a65a2a" />
      {/* taza + vapor */}
      <g>
        <rect x="118" y="112" width="26" height="20" rx="4" fill="#ffffff" />
        <path d="M144 116h6a5 5 0 0 1 0 10h-6" fill="none" stroke="#ffffff" strokeWidth="3" />
        <rect x="122" y="116" width="18" height="8" rx="2" fill="#8d4f24" />
        <path d="M126 108c-3-4 3-6 0-10M134 108c-3-4 3-6 0-10" stroke="#c9a27a" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
      </g>
      {/* medialuna */}
      <path d="M158 126c8-6 20-2 20 6-6-2-14-2-20-6z" fill="#e0a13c" />
    </svg>
  );
}

const momentos = [
  { titulo: "Cena en familia", Escena: EscenaFamilia },
  { titulo: "Lo pedís y llega", Escena: EscenaDelivery },
  { titulo: "Noche de peli", Escena: EscenaSillon },
  { titulo: "Mañanas ricas", Escena: EscenaCafe },
];

export default function Inicio() {
  const navigate = useNavigate();
  const irAIngresar = () => navigate("/roles");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header menuUser={false}>
        <button
          onClick={irAIngresar}
          className="rounded-full bg-trego-orange px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-95"
        >
          Iniciar
        </button>
      </Header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          {/* Fondo decorativo */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-100 opacity-60 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 top-40 h-56 w-56 rounded-full bg-trego-beige opacity-80 blur-2xl" />

          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pt-16 pb-12 text-center sm:pt-24">
            <span className="text-sm font-semibold uppercase tracking-widest text-orange-500">
              Lo pedís, Trego
            </span>

            <h1 className="text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl md:text-6xl">
              Tu comida favorita,
              <br />
              <span className="text-trego-orange">a un pedido de distancia</span>
            </h1>

            <p className="max-w-xl text-base text-gray-500 sm:text-lg">
              Trego conecta clientes, restaurantes y administradores en una sola
              plataforma de pedidos y reparto a domicilio.
            </p>

            {/* Botón central */}
            <button
              onClick={irAIngresar}
              className="group mt-2 inline-flex items-center gap-2 rounded-full bg-trego-orange px-9 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:shadow-xl active:scale-[0.98]"
            >
              Iniciar
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>

          </div>

          {/* Galería de momentos (escenas ficticias ilustradas) */}
          <div className="relative mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 pb-16 lg:grid-cols-4">
            {momentos.map(({ titulo, Escena }) => (
              <figure
                key={titulo}
                className="group overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
                    <Escena />
                  </div>
                </div>
                <figcaption className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  {titulo}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* PERFILES */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Una plataforma, tres experiencias
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Cada perfil tiene sus propias herramientas dentro de Trego.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {perfiles.map((p) => (
              <div
                key={p.titulo}
                className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span
                  className={`absolute inset-x-0 top-0 h-1 ${p.barra}`}
                  aria-hidden="true"
                />
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-xl ${p.iconBg}`}
                >
                  <img src={p.icon} alt="" className="h-11 w-11" />
                </div>
                <h3 className={`text-lg font-bold ${p.acento}`}>{p.titulo}</h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {p.descripcion}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* EQUIPO */}
        <section className="bg-trego-beige">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="mb-10 text-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-trego-brown">
                Grupo 6
              </span>
              <h2 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                El equipo detrás de Trego
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Proyecto final de la carrera Tecnólogo en Informática.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {integrantes.map((nombre) => (
                <div
                  key={nombre}
                  className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-trego-orange text-base font-bold text-white ring-2 ring-white">
                    {iniciales(nombre)}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {nombre}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <img src={bolsaTrego} alt="Trego" className="mx-auto mb-5 h-16 w-16" />
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            ¿Listo para empezar?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Ingresá y elegí tu tipo de usuario para continuar.
          </p>
          <button
            onClick={irAIngresar}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-trego-orange px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:shadow-xl active:scale-[0.98]"
          >
            Iniciar
          </button>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center">
          <div className="flex items-center gap-2">
            <img src={bolsaTrego} alt="" className="h-6 w-6" />
            <span className="font-bold text-gray-800">Trego</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Trego — Grupo 6 · Lo pedís, Trego
          </p>
        </div>
      </footer>
    </div>
  );
}

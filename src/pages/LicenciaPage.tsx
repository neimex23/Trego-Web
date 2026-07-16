import { useNavigate } from "react-router";
import Header from "../components/body/Header.js";
import bolsaTrego from "../assets/bolsa-trego.svg";

interface Seccion {
  titulo: string;
  parrafos: string[];
  destacado?: boolean;
}

const SECCIONES: Seccion[] = [
  {
    titulo: "Acceptance",
    parrafos: [
      "In order to get any license under these terms, you must agree to them as both strict obligations and conditions to all your licenses.",
    ],
  },
  {
    titulo: "Copyright License",
    parrafos: [
      "The licensor grants you a copyright license for the software to do everything you might do with the software that would otherwise infringe the licensor's copyright in it for any permitted purpose. However, you may only distribute the software according to Distribution License and make changes or new works based on the software according to Changes and New Works License.",
    ],
  },
  {
    titulo: "Distribution License",
    parrafos: [
      "The licensor grants you an additional copyright license to distribute copies of the software. Your license to distribute covers distributing the software with changes and new works permitted by Changes and New Works License.",
    ],
  },
  {
    titulo: "Notices",
    parrafos: [
      "You must ensure that anyone who gets a copy of any part of the software from you also gets a copy of these terms or the URL for them above, as well as copies of any plain-text lines beginning with Required Notice: that the licensor provided with the software. For example:",
      "Required Notice: Copyright Yoyodyne, Inc. (http://example.com)",
    ],
  },
  {
    titulo: "Changes and New Works License",
    parrafos: [
      "The licensor grants you an additional copyright license to make changes and new works based on the software for any permitted purpose.",
    ],
  },
  {
    titulo: "Patent License",
    parrafos: [
      "The licensor grants you a patent license for the software that covers patent claims the licensor can license, or becomes able to license, that you would infringe by using the software.",
    ],
  },
  {
    titulo: "Noncommercial Purposes",
    parrafos: ["Any noncommercial purpose is a permitted purpose."],
  },
  {
    titulo: "Personal Uses",
    parrafos: [
      "Personal use for research, experiment, and testing for the benefit of public knowledge, personal study, private entertainment, hobby projects, amateur pursuits, or religious observance, without any anticipated commercial application, is use for a permitted purpose.",
    ],
  },
  {
    titulo: "Noncommercial Organizations",
    parrafos: [
      "Use by any charitable organization, educational institution, public research organization, public safety or health organization, environmental protection organization, or government institution is use for a permitted purpose regardless of the source of funding or obligations resulting from the funding.",
    ],
  },
  {
    titulo: "Fair Use",
    parrafos: [
      'You may have "fair use" rights for the software under the law. These terms do not limit them.',
    ],
  },
  {
    titulo: "No Other Rights",
    parrafos: [
      "These terms do not allow you to sublicense or transfer any of your licenses to anyone else, or prevent the licensor from granting licenses to anyone else. These terms do not imply any other licenses.",
    ],
  },
  {
    titulo: "Patent Defense",
    parrafos: [
      "If you make any written claim that the software infringes or contributes to infringement of any patent, your patent license for the software granted under these terms ends immediately. If your company makes such a claim, your patent license ends immediately for work on behalf of your company.",
    ],
  },
  {
    titulo: "Violations",
    parrafos: [
      "The first time you are notified in writing that you have violated any of these terms, or done anything with the software not covered by your licenses, your licenses can nonetheless continue if you come into full compliance with these terms, and take practical steps to correct past violations, within 32 days of receiving notice. Otherwise, all your licenses end immediately.",
    ],
  },
  {
    titulo: "No Liability",
    destacado: true,
    parrafos: [
      "As far as the law allows, the software comes as is, without any warranty or condition, and the licensor will not be liable to you for any damages arising out of these terms or the use or nature of the software, under any kind of legal claim.",
    ],
  },
  {
    titulo: "Definitions",
    parrafos: [
      "The licensor is the individual or entity offering these terms, and the software is the software the licensor makes available under these terms.",
      "You refers to the individual or entity agreeing to these terms.",
      "Your company is any legal entity, sole proprietorship, or other kind of organization that you work for, plus all organizations that have control over, are under the control of, or are under common control with that organization. Control means ownership of substantially all the assets of an entity, or the power to direct its management and policies by vote, contract, or otherwise. Control can be direct or indirect.",
      "Your licenses are all the licenses granted to you for the software under these terms.",
      "Use means anything you do with the software requiring one of your licenses.",
    ],
  },
];

export default function LicenciaPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header menuUser={false}>
        <button
          onClick={() => navigate("/")}
          className="rounded-full bg-trego-orange px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-95"
        >
          Inicio
        </button>
      </Header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-trego-beige">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-100 opacity-60 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-orange-200 opacity-50 blur-2xl" />

          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 pt-16 pb-14 text-center">
            <img src={bolsaTrego} alt="Trego" className="h-16 w-16" />
            <span className="text-sm font-semibold uppercase tracking-widest text-orange-500">
              Licencia
            </span>
            <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
              PolyForm Noncommercial
              <br />
              <span className="text-trego-orange">License 1.0.0</span>
            </h1>
            <p className="max-w-xl text-base text-gray-600 sm:text-lg">
              Trego se distribuye para fines exclusivamente no comerciales. Está
              permitido usar, modificar y distribuir el software siempre que sea
              con un propósito no comercial.
            </p>
            <a
              href="https://polyformproject.org/licenses/noncommercial/1.0.0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-trego-orange px-6 py-2.5 text-sm font-semibold text-trego-orange transition-all hover:bg-trego-orange hover:text-white"
            >
              Ver texto oficial
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </a>
          </div>
        </section>

        {/* AVISO RÁPIDO */}
        <section className="mx-auto max-w-4xl px-6 pt-12">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-5">
              <h3 className="text-sm font-bold text-emerald-700">
                Uso no comercial
              </h3>
              <p className="mt-1 text-sm text-emerald-800/80">
                Estudio, investigación, proyectos personales y organizaciones
                sin fines de lucro.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-orange-100 bg-orange-50 p-5">
              <h3 className="text-sm font-bold text-orange-700">
                Cambios permitidos
              </h3>
              <p className="mt-1 text-sm text-orange-800/80">
                Podés modificar y distribuir el software conservando estos
                términos.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-5">
              <h3 className="text-sm font-bold text-red-700">Sin uso comercial</h3>
              <p className="mt-1 text-sm text-red-800/80">
                No se autoriza su explotación comercial sin consentimiento de los
                autores.
              </p>
            </div>
          </div>
        </section>

        {/* SECCIONES DE LA LICENCIA */}
        <section className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex flex-col gap-4">
            {SECCIONES.map((sec) => (
              <article
                key={sec.titulo}
                className={`relative overflow-hidden rounded-2xl border-2 p-6 shadow-sm transition-all hover:shadow-md ${
                  sec.destacado
                    ? "border-red-200 bg-red-50"
                    : "border-gray-100 bg-white"
                }`}
              >
                <span
                  className={`absolute inset-y-0 left-0 w-1 ${
                    sec.destacado ? "bg-trego-cart" : "bg-trego-orange"
                  }`}
                  aria-hidden="true"
                />
                <h2 className="mb-3 text-lg font-bold text-gray-900">
                  {sec.titulo}
                </h2>
                <div className="flex flex-col gap-3">
                  {sec.parrafos.map((p, i) => (
                    <p
                      key={i}
                      className={`text-sm leading-relaxed ${
                        sec.destacado
                          ? "font-medium text-red-900"
                          : "text-gray-600"
                      }`}
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            Texto de la licencia PolyForm Noncommercial 1.0.0 ·{" "}
            <a
              href="https://polyformproject.org/licenses/noncommercial/1.0.0"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-trego-orange"
            >
              polyformproject.org
            </a>
          </p>
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

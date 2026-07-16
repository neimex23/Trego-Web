import { Link } from "react-router";
import trego from "../../assets/bolsa-trego.svg";

interface FooterColumnProps {
  title: string;
  links: { label: string; href: string }[];
}

const LINKS = {
  cuenta: [
    { label: "Mis pedidos", href: "/Historial" },
    { label: "Mi perfil", href: "/perfil/cliente" },
  ],
  soporte: [
    { label: "Contacto", href: "mailto:tregoappsoporte@gmail.com" },
    { label: "¿Sos restaurante?", href: "/login/Restaurante" },
    { label: "Licencia", href: "/licencia" },
  ],
};

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
        {title}
      </h4>
      <ul className="flex flex-col gap-2">
        {links.map((link) => {
          // Detectamos si es un enlace externo o un correo
          const esExterno =
            link.href.startsWith("http") || link.href.startsWith("mailto:");

          return (
            <li key={link.label}>
              {esExterno ? (
                <a
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-trego-orange transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  to={link.href}
                  className="text-sm text-gray-500 hover:text-trego-orange transition-colors"
                >
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      {/* Redujimos el max-w-6xl a max-w-5xl para acotar el espacio general */}
      <div className="mx-auto max-w-5xl px-6 pt-10 pb-4">
        {/* Cambiamos Grid por Flexbox para controlar el espaciado exacto */}
        <div className="flex flex-col md:flex-row flex-wrap justify-center gap-12 md:gap-20 lg:gap-28 mb-8">
          {/* Columna marca */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-trego-orange">
                <img src={trego} alt="Trego" className="h-16 w-16" />
              </div>
              <span className="text-xl font-bold text-gray-900">Trego</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Lo pedís, Trego.
            </p>
          </div>

          {/* Columnas de links */}
          <FooterColumn title="Cuenta" links={LINKS.cuenta} />
          <FooterColumn title="Soporte" links={LINKS.soporte} />

          {/* Columna Descarga de App */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Descargá la app
            </h4>
            <div className="flex flex-col gap-3 mt-1">
              <a
                href="https://github.com/Pino3001/Trego-android/releases/tag/v1.0.0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-36 h-10 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Descargar APK
              </a>
            </div>
          </div>
        </div>

        {/* Sub-barra inferior (Solo Copyright centrado) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">
            © {currentYear} Trego. Proyecto Final.
          </p>
          <span className="hidden sm:inline text-gray-300">·</span>
          <Link
            to="/licencia"
            className="text-sm text-gray-500 hover:text-trego-orange transition-colors"
          >
            Licencia PolyForm Noncommercial 1.0.0
          </Link>
        </div>
      </div>
    </footer>
  );
}

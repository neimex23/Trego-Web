import Header from "../../components/body/Header.js";
import logoAdmin from "../../assets/tregoAdminy.svg";
import logoRestaurante from "../../assets/tregoRestaurante.svg";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { TextInput } from "../../components/TextInput.js";
import { recuperarContraseña } from "../../api/usuariosApi.js";
import { esEmailValido } from "../../utils/validarEmail.js";

type TipoLogin = "Administrador" | "Restaurante";

interface RecuperarContraseñaPageProps {
  tipo: TipoLogin;
}

const CONFIG: Record<
  TipoLogin,
  {
    logo: string;
    loginPath: string;
    colorStyle: string;
    panelBg: string;
    btnBg: string;
    btnHover: string;
    spinnerBorder: string;
    titulo: string;
  }
> = {
  Administrador: {
    logo: logoAdmin,
    loginPath: "/login/Administrador",
    colorStyle: "trego-admin",
    panelBg: "bg-trego-admin",
    btnBg: "bg-trego-admin",
    btnHover: "hover:bg-blue-700",
    spinnerBorder: "border-t-trego-admin",
    titulo: "Administradores",
  },
  Restaurante: {
    logo: logoRestaurante,
    loginPath: "/login/Restaurante",
    colorStyle: "trego-restaurante",
    panelBg: "bg-trego-restaurante",
    btnBg: "bg-trego-restaurante",
    btnHover: "hover:bg-green-700",
    spinnerBorder: "border-t-trego-restaurante",
    titulo: "Restaurantes",
  },
};

type Paso = "FORM" | "LOADING" | "EXITO";

export default function RecuperarContraseñaPage({
  tipo,
}: RecuperarContraseñaPageProps) {
  const navigate = useNavigate();
  const cfg = CONFIG[tipo];

  const [paso, setPaso] = useState<Paso>("FORM");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const enviarSolicitud = async () => {
    if (!email.trim()) {
      setError("Ingresá tu correo electrónico.");
      return;
    }
    if (!esEmailValido(email)) {
      setError("Ingresá un correo electrónico válido.");
      return;
    }

    setError(null);
    setPaso("LOADING");

    try {
      await recuperarContraseña(email);
      setPaso("EXITO");
    } catch (err: unknown) {
      setPaso("FORM");
      if (err instanceof Error) {
        switch (err.message) {
          case "RECUPERAR_NO_AUTORIZADO":
            setError(
              "El servidor no permite esta operación sin autenticación. El equipo de backend debe habilitar el endpoint.",
            );
            break;
          case "CORREO_NO_ENCONTRADO":
          case "No existe un usuario con ese correo.":
            setError("No existe un usuario registrado con ese correo.");
            break;
          default:
            setError(
              err.message && err.message !== "ERROR_SERVIDOR"
                ? err.message
                : "No se pudo procesar la solicitud. Intentá de nuevo más tarde.",
            );
        }
      } else {
        setError("Ocurrió un error inesperado.");
      }
    }
  };

  return (
    <>
      <Header tipoUser={tipo} onLogout={() => navigate(cfg.loginPath)} menuUser={false}/>

      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-10">
        <div className="flex w-full max-w-4xl rounded-3xl mb-5 overflow-hidden shadow-2xl shadow-green-100 bg-white">
          <div
            className={`hidden md:flex flex-col items-center justify-center ${cfg.panelBg} w-5/12 h-130 p-10 gap-6`}
          >
            <div className="w-60 h-60 rounded-full bg-white flex items-center justify-center shadow-inner mb-10">
              <img src={cfg.logo} alt="Trego" />
            </div>
            <p className="text-white text-4xl font-bold tracking-tight text-center leading-tight">
              Lo Pedís, Trego
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-start md:px-14 py-8 gap-5">
            <div>
              <h1 className="text-3xl font-bold text-center text-gray-800">
                Recuperar contraseña
              </h1>
              <h2 className="text-lg mt-2 font-medium text-center text-gray-500">
                {cfg.titulo}
              </h2>

              {error ? (
                <div className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex gap-2">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              ) : (
                <div className="mt-5 h-2" />
              )}
            </div>

            {paso === "FORM" && (
              <div className="flex flex-col gap-6">
                <p className="text-sm text-gray-600 text-center">
                  Ingresá el correo de tu cuenta. Te enviaremos una contraseña
                  temporal por email para que puedas volver a iniciar sesión.
                </p>

                <TextInput
                  value={email}
                  onChange={setEmail}
                  placeholder="Correo electrónico"
                  type="email"
                  colorStyle={cfg.colorStyle}
                  onEnter={enviarSolicitud}
                />

                <button
                  type="button"
                  onClick={enviarSolicitud}
                  className={`w-full py-3.5 px-6 rounded-3xl ${cfg.btnBg} ${cfg.btnHover} transition-all duration-200 text-gray-100 text-lg font-bold shadow-md`}
                >
                  Enviar contraseña temporal
                </button>

                <Link
                  to={cfg.loginPath}
                  className="text-center text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            )}

            {paso === "LOADING" && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div
                  className={`w-12 h-12 rounded-full border-4 border-gray-200 ${cfg.spinnerBorder} animate-spin`}
                />
                <p className="text-sm text-gray-400">Enviando solicitud...</p>
              </div>
            )}

            {paso === "EXITO" && (
              <div className="flex flex-col gap-6">
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-800">
                  <p className="font-medium mb-2">Solicitud enviada</p>
                  <p>
                    Si el correo está registrado, recibiste una contraseña
                    temporal. Revisá tu bandeja de entrada.
                  </p>
                  <p className="mt-2 text-green-700">
                    En desarrollo local:{" "}
                    <a
                      href="http://localhost:8025"
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium"
                    >
                      MailHog (localhost:8025)
                    </a>
                  </p>
                </div>

                <p className="text-sm text-gray-600 text-center">
                  Iniciá sesión con la contraseña temporal y cambiala desde tu
                  perfil lo antes posible.
                </p>

                <button
                  type="button"
                  onClick={() => navigate(cfg.loginPath)}
                  className={`w-full py-3.5 px-6 rounded-3xl ${cfg.btnBg} ${cfg.btnHover} transition-all duration-200 text-gray-100 text-lg font-bold shadow-md`}
                >
                  Ir al login
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

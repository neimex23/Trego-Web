import Header from "../../components/body/Header.js";
import logo from "../../assets/tregoAdminy.svg";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import OTPInput from "../../components/inicio/OTPInput.js";
import { TextInput } from "../../components/TextInput.js";
import TextoDivider from "../../components/TextoDivider.js";
import { apiAuth } from "../../api/apiAuth.js";
import type { DTOLoginRegistro } from "../../data/DTOLoginRegistro.js";
import { guardarSesion } from "../../utils/sesion.js";

type AuthStep = "INGRESO" | "LOADING";

export default function LoginAdmin() {
  const navigate = useNavigate();

  const [step, setStep] = useState<AuthStep>("INGRESO");

  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState<string>("");
  const [contrasenia, setContrasenia] = useState<string>("");

  const solicitarInicio = () => {
    // Validar campo vacío
    if (!email.trim()) {
      setError("Ingresá tu correo electrónico.");
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Ingresá un correo electrónico válido.");
      return;
    }

    if (!contrasenia) {
      setError("Ingresá tu contraseña.");
      return;
    }

    iniciarSesion();
  };

  const iniciarSesion = async () => {
    setError(null);
    setStep("LOADING");
    try {
      const loginResponse: DTOLoginRegistro = {
        email: email,
        password: contrasenia,
      };

      const data = await apiAuth.login(loginResponse);

      // Guardar el token que te devolvió Spring Boot para tus futuras peticiones
      guardarSesion(data.token, data.rol);
      window.dispatchEvent(new Event("trego-sesion-iniciada"));
      //       /*Ver esto con mas detalle tenemos que usar un dato que google no pueda obtener de firebase*/
      // // Dependiendo del tipo de inicio se dirije
      // const isNewUser = !data.nombre || data.nombre === "";
      // if (data.rol == "Administrador") {
      //   if (isNewUser) {
      //     navigate("/restaurantes"); // Cuando implementemos modificar perfil aca cambiamos la redireccion
      //   } else {
      //     navigate("/restaurantes/solicitarAlta");
      //   }
      // } else {
      //   setStep("INGRESO");
      //   setError("El correo ingresado no pertenece a un Administrador.");
      // }
      if (!data.token) {
        setStep("INGRESO");
        setError("El servidor no devolvió un token de sesión. ¿Está corriendo el backend?");
        return;
      }

      if (data.rol === "Administrador") {
        navigate("/admin/restaurantes");
      } else {
        setStep("INGRESO");
        setError("El correo ingresado no pertenece a un Administrador.");
      }
    } catch (err: unknown) {
      setStep("INGRESO");

      if (err instanceof Error) {
        switch (err.message) {
          case "CREDENCIALES_INVALIDAS":
            setError("Usuario o contraseña incorrectos.");
            break;

          case "CUENTA_DESHABILITADA":
            setError(
              "Acceso denegado. Su cuenta se encuentra deshabilitada. Contacte al soporte.",
            );
            /**Mandar a solicitar alta y negar el ingreso a los componente de restaurante habilitado */
            break;

          case "ERROR_SERVIDOR":
            setError(
              "Error interno del servidor. Intente nuevamente más tarde.",
            );
            break;

          default:
            // Fallo de red u otro error inesperado
            setError("No se pudo conectar con el servidor de Trego.");
            break;
        }
      } else {
        // err no es instancia de Error (caso muy raro)
        setError("Ocurrió un error inesperado.");
      }
    }
  };
  return (
    <>
      {/* Anchor invisible para reCAPTCHA */}
      <div id="recaptcha-container" />

      <Header tipoUser="Administrador" menuUser={false}/>

      <main className="relative min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-10">
        <button
          type="button"
          onClick={() => navigate("/roles")}
          className="absolute left-4 top-4 sm:left-6 sm:top-6 flex items-center gap-1.5 rounded-full border-2 border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:border-sky-400 hover:text-sky-600 active:scale-95"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Volver
        </button>
        <div className="flex w-full max-w-4xl rounded-3xl mb-5 overflow-hidden shadow-2xl shadow-green-100 bg-white">
          {/* Panel izquierdo — marca */}
          <div className="hidden md:flex flex-col items-center justify-center bg-trego-admin w-5/12 p-10 gap-6">
            <div className="w-60 h-60 rounded-full bg-white flex items-center justify-center shadow-inner mb-10">
              <img src={logo} />
            </div>
            <p className="text-white text-4xl font-bold tracking-tight text-center leading-tight">
              Lo Pedís, Trego
            </p>
          </div>

          {/* Panel derecho — formulario */}
          <div className="flex-1 flex flex-col justify-start md:px-14 py-8 gap-5">
            {/* Encabezado dinámico */}
            <div className="">
              {step === "INGRESO" && (
                <>
                  <h1 className="text-4xl font-bold text-center text-gray-800">
                    Bienvenido
                  </h1>
                  <h2 className="text-2xl mt-5 font-bold text-center text-gray-600">
                    Inicio Administradores
                  </h2>
                  {/* Error */}
                  {error ? (
                    <div className="mt-5 h-11 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 justify-center flex gap-2">
                      <span className="mt-0.5 shrink-0">⚠</span>
                      <span>{error}</span>
                    </div>
                  ) : (
                    <div className="mt-5 h-11" />
                  )}
                </>
              )}

            </div>

            {/* ── Selección de método ── */}
            {step === "INGRESO" && (
              <div className="flex flex-col gap-6">
                <TextoDivider texto="Ingresa Usuario y Contraseña" />

                <TextInput
                  value={email}
                  onChange={setEmail}
                  placeholder="Correo electrónico"
                  type="email"
                  colorStyle="trego-admin"
                />

                <TextInput
                  value={contrasenia}
                  onChange={setContrasenia}
                  placeholder="Contraseña"
                  type="password"
                  colorStyle="trego-admin"
                  onEnter={solicitarInicio}
                />

                {/* falta endpoint backend: POST /api/auth/admin/verificar-otp (y login admin con OTP) */}
                <button
                  onClick={solicitarInicio}
                  className="
                    group flex items-center justify-center gap-3
                    w-full py-3.5 px-6 rounded-3xl
                    bg-trego-admin hover:bg-blue-700
                    transition-all duration-200 text-gray-100 text-lg font-bold
                    shadow-md hover:shadow-md hover:shadow-green-100
                  "
                >
                  Iniciar Sesión
                </button>

                <Link
                  to="/login/Administrador/recuperar"
                  className="text-center text-sm text-gray-500 hover:text-trego-admin transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            {/* ── Loading ── */}
            {step === "LOADING" && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-trego-admin animate-spin" />
                <p className="text-sm text-gray-400">
                  Verificando tus datos...
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

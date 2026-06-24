import { useState } from "react";
import { Link, useNavigate } from "react-router";
import type { DTOLoginRegistro } from "../../data/DTOLoginRegistro.js";
import { apiAuth } from "../../api/apiAuth.js";
import { obtenerActual } from "../../api/apiRestaurante.js";
import Header from "../../components/body/Header.js";
import logo from "../../assets/tregoRestaurante.svg";
import TextoDivider from "../../components/TextoDivider.js";
import { TextInput } from "../../components/TextInput.js";
import { guardarSesion } from "../../utils/sesion.js";

type AuthStep = "INGRESO" | "LOADING";

export default function LoginRestaurante() {
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

      const response = await obtenerActual();

      // Asumimos que el backend te devuelve este dato (o lo sacas de isNewUser)
      localStorage.setItem(
        "restauranteHabilitado",
        response.habilitado ? "true" : "false",
      );
      console.log("Token", data.token);
      window.dispatchEvent(new Event("trego-sesion-iniciada"));

      if (data.rol === "Restaurante") {
        if (response.habilitado) {
          navigate("/restaurantes/ListarPedidosSinConfirmar"); // Va directo a trabajar
        } else {
          navigate("/restaurantes/solicitarAlta"); // Va a llenar los papeles
        }
      } else {
        setStep("INGRESO");
        setError("El correo ingresado no pertenece a un Restaurante.");
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

      <Header
        tipoUser="Restaurante"
        onLogout={() => {}}
        children={
          <button
            type="button"
            onClick={() => navigate("/restaurantes/registrarRestaurante")}
            className="flex h-10 sm:h-11 items-center justify-center rounded-full border-2 px-5 
                      sm:px-6 text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 shadow-sm
                      border-trego-restaurante text-trego-restaurante hover:bg-trego-restaurante hover:text-white"
            aria-label="Registrarse"
          >
            Registrarse
          </button>
        }
        menuUser={false}
      />

      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-10">
        <div className="flex w-full max-w-4xl rounded-3xl mb-5 overflow-hidden shadow-2xl shadow-green-100 bg-white">
          {/* Panel izquierdo — marca */}
          <div className="hidden md:flex flex-col items-center justify-center bg-trego-restaurante w-5/12 p-10 gap-6">
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
                    Inicio Restaurantes
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

              {step === "LOADING" && (
                <h1 className="text-2xl font-bold text-gray-800">
                  Verificando...
                </h1>
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
                  colorStyle="trego-restaurante"
                  
                />

                <TextInput
                  value={contrasenia}
                  onChange={setContrasenia}
                  placeholder="Contraseña"
                  type="password"
                  colorStyle="trego-restaurante"
                  onEnter={solicitarInicio}
                />

                <button
                  onClick={solicitarInicio}
                  className="
                    group flex items-center justify-center gap-3
                    w-full py-3.5 px-6 rounded-3xl
                    bg-trego-restaurante hover:bg-green-700
                    transition-all duration-200 text-gray-100 text-lg font-bold
                    shadow-md hover:shadow-md hover:shadow-green-100
                  "
                >
                  Iniciar Sesión
                </button>

                <Link
                  to="/login/Restaurante/recuperar"
                  className="text-center text-sm text-gray-500 hover:text-trego-restaurante transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            {/* ── Loading ── */}
            {step === "LOADING" && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-trego-restaurante animate-spin" />
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

import { useState } from "react";
import { useNavigate } from "react-router";
import { apiRegistrarRestaurante } from "../../api/apiRegistrarRestaurante.js";
import {
  TextInput,
  type SeguridadPassword,
} from "../../components/TextInput.js";
import type { DTOLoginRegistro } from "../../data/DTOLoginRegistro.js";
import Header from "../../components/body/Header.js";
import TextoDivider from "../../components/TextoDivider.js";
import OTPInput from "../../components/inicio/OTPInput.js";
import logo from "../../assets/tregoRestaurante.svg";
import { guardarSesion } from "../../utils/sesion.js";

type AuthStep = "INGRESO" | "VERI_CODIGO" | "LOADING";

export default function RegistrarRestaurante() {
  const navigate = useNavigate();

  const [step, setStep] = useState<AuthStep>("INGRESO");

  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [email, setEmail] = useState<string>("");
  const [contrasenia, setContrasenia] = useState<string>("");
  const [verifContrasenia, setVeriContrasenia] = useState<string>("");
  const [seguridadContra, setSeguridadContra] = useState<SeguridadPassword>();
  const [codigoVeri, setCodigoVeri] = useState<string>("");

  const verificarCodigo = async () => {
    if (codigoVeri.length !== 6) {
      setError("Ingresá el código de 6 dígitos.");
      return;
    }

    setError(null);
    setStep("LOADING");

    try {
      const result = await apiRegistrarRestaurante.confirmarRegistro(
        email,
        codigoVeri,
      );

      if (result.success && result.login?.token) {
        guardarSesion(result.login.token, result.login.rol);
        localStorage.setItem("restauranteHabilitado", "false");
        window.dispatchEvent(new Event("trego-sesion-iniciada"));
        navigate("/restaurantes/solicitarAlta");
        return;
      }

      setError(
        result.message ||
          "No se pudo verificar el código. Pedí uno nuevo e intentá de nuevo.",
      );
      setStep("VERI_CODIGO");
    } catch {
      setError("Ocurrió un error inesperado al conectar con el servidor.");
      setStep("VERI_CODIGO");
    }
  };

  const solicitarRegistro = () => {
    console.log(seguridadContra);
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

    // Validar seguridad mínima
    if (
      !seguridadContra ||
      seguridadContra == "Regular" ||
      seguridadContra == "Debil"
    ) {
      setError(
        "La contraseña es demasiado débil. Usá al menos 8 caracteres, mayúsculas y números.",
      );
      return;
    }

    if (contrasenia !== verifContrasenia) {
      setError("La contraseñas no coinciden.");
      return;
    }

    solicitarCodigo();
  };

  const solicitarCodigo = async () => {
    setError(null);
    setStep("LOADING");

    try {
      const loginResponse: DTOLoginRegistro = {
        email: email,
        password: contrasenia,
      };

      const response =
        await apiRegistrarRestaurante.registrarRestaurante(loginResponse);

      if (response.success) {
        setStep("VERI_CODIGO");
      } else {
        setStep("INGRESO");
        setError(response.message);
      }
    } catch (err: unknown) {
      setStep("INGRESO");
      setError("Ocurrió un error inesperado al conectar con el servidor.");
    }
  };

  const reenviarCodigo = async () => {
    setError(null);
    setStep("LOADING");

    try {
      const response = await apiRegistrarRestaurante.reenviarCodigo(email);

      if (response.success) {
        setStep("VERI_CODIGO");
      } else {
        setStep("INGRESO");
        setError(response.message);
      }
    } catch (err: unknown) {
      setStep("INGRESO");
      setError("Ocurrió un error inesperado al conectar con el servidor.");
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
            onClick={() => navigate("/login/Restaurante")}
            className="flex h-10 sm:h-11 items-center justify-center rounded-full border-2 px-5 
                      sm:px-6 text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 shadow-sm
                      border-trego-restaurante text-trego-restaurante hover:bg-trego-restaurante hover:text-white"
            aria-label="Registrarse"
          >
            LogIn
          </button>
        }
        menuUser={false}
      />

      <main className="min-h-[calc(97vh-64px)] flex items-center justify-center bg-gray-50 ">
        <div className="flex w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl shadow-green-100 bg-white">
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
            <div className="relative">
              {step === "INGRESO" && (
                <>
                  <h1 className="text-4xl font-bold text-center text-gray-800">
                    Bienvenido
                  </h1>
                  <h2 className="text-2xl mt-5 font-bold text-center text-gray-600">
                    Registro Restaurantes
                  </h2>
                  {/* Error */}
                  {error ? (
                    <div className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 justify-center flex gap-2">
                      <span className="mt-0.5 shrink-0">⚠</span>
                      <span>{error}</span>
                    </div>
                  ) : (
                    <div className="mt-5 h-11" />
                  )}
                </>
              )}
              {step === "VERI_CODIGO" && (
                <>
                  <button
                    onClick={() => {
                      setStep("INGRESO");
                      setError(null);
                      setCodigoVeri("");
                    }}
                    className="text-trego-restaurante text-sm font-medium mb-3 flex items-center gap-1 hover:underline"
                  >
                    ← Volver
                  </button>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Código de verificación
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    En desarrollo, revisá la consola del backend (no llega por
                    email)
                  </p>
                  {error ? (
                    <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex gap-2">
                      <span className="mt-0.5 shrink-0">⚠</span>
                      <span>{error}</span>
                    </div>
                  ) : null}
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
              <div className="flex flex-col gap-10">
                <TextoDivider texto="Ingresa Usuario y Contraseña" />

                <TextInput
                  value={email}
                  onChange={setEmail}
                  placeholder="Correo electrónico"
                  type="email"
                  colorStyle="trego-restaurante"
                />
                <div className="flex flex-col gap-2">
                  <TextInput
                    value={contrasenia}
                    onChange={setContrasenia}
                    placeholder="Contraseña"
                    type="password"
                    colorStyle="trego-restaurante"
                    showStrength
                    onChangeSeguridad={setSeguridadContra}
                    onEnter={solicitarRegistro}
                  />

                  <TextInput
                    value={verifContrasenia}
                    onChange={setVeriContrasenia}
                    placeholder="Verificación de Contraseña"
                    type="password"
                    colorStyle="trego-restaurante"
                    showStrength
                    onEnter={solicitarRegistro}
                  />
                </div>

                <button
                  onClick={solicitarRegistro}
                  className="
                    group flex items-center justify-center gap-3
                    w-full py-3.5 px-6 rounded-3xl
                    bg-trego-restaurante hover:bg-green-700
                    transition-all duration-200 text-gray-100 text-lg font-bold
                    shadow-md hover:shadow-md hover:shadow-green-100
                  "
                >
                  Registrarse
                </button>
              </div>
            )}

            {/* ── Ingreso de código OTP ── */}
            {step === "VERI_CODIGO" && (
              <div className="flex flex-col gap-5">
                <OTPInput
                  variant="restaurante"
                  value={codigoVeri}
                  onChange={setCodigoVeri}
                />

                <button
                  onClick={verificarCodigo}
                  disabled={codigoVeri.length !== 6}
                  className="
                    group flex items-center justify-center gap-3
                    w-full py-3.5 px-6 rounded-3xl
                    bg-trego-restaurante hover:bg-green-700
                    transition-all duration-200 text-gray-100 text-lg font-bold
                    shadow-md hover:shadow-md hover:shadow-green-100
                  "
                >
                  Verificar código
                </button>

                <div className="text-center text-sm text-gray-500">
                  {resendCooldown > 0 ? (
                    <span>
                      Podés reenviar el código en{" "}
                      <span className="font-semibold text-orange-500">
                        {resendCooldown}s
                      </span>
                    </span>
                  ) : (
                    <button
                      onClick={reenviarCodigo}
                      className="text-trego-restaurante font-semibold hover:underline"
                    >
                      Volver a pedir el código
                    </button>
                  )}
                </div>
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

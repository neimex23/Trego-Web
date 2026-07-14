import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

// Firebase imports — ajustá la ruta a tu configuración
import { auth, googleProvider } from "../../../firebase.config.js";
import {
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";
import Header from "../../components/body/Header.js";
import logo from "../../assets/bolsa-trego.svg";
import OTPInput from "../../components/inicio/OTPInput.js";
import { GoogleIcon, SMSIcon } from "../../components/icons.jsx";
import { apiAuth } from "../../api/apiAuth.js";
import TextoDivider from "../../components/TextoDivider.js";
import { guardarSesion } from "../../utils/sesion.js";

// ─── Tipos de estados del inicio ───────────────────────────────────────────────

type AuthStep = "METHOD_SELECT" | "SMS_PHONE" | "SMS_CODE" | "LOADING";

// ─── Helpers ──────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier | undefined;
  }
}

function clearRecaptcha() {
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
    window.recaptchaVerifier = undefined;
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LoginCliente() {
  const navigate = useNavigate();

  const [step, setStep] = useState<AuthStep>("METHOD_SELECT");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Limpia recaptcha al desmontar
  useEffect(() => () => clearRecaptcha(), []);

  // Countdown para reenvío de código
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // ------ Redirige tras login exitoso -----------------
  function handlePostLogin(isNewUser: boolean) {
    if (isNewUser) {
      navigate("/completar-perfil"); // Cuando implementemos modificar perfil aca cambiamos la redireccion
    } else {
      navigate("/restaurantes");
    }
  }

  // ── Google ─────────────────────────────────────────────────────────────────
  async function handleGoogle() {
    setError(null);
    setStep("LOADING");
    try {
      // Firebase Web abre el popup
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const data = await apiAuth.loginConGoogle(idToken);

      // Guardar el token que te devolvió Spring Boot para tus futuras peticiones
      guardarSesion(data.token, data.rol);
      window.dispatchEvent(new Event("trego-sesion-iniciada"));

      /*Ver esto con mas detalle tenemos que usar un dato que google no pueda obtener de firebase*/
      // Dependiendo del tipo de inicio se dirije
      const isNewUser = !data.nombre || data.nombre === "";
      handlePostLogin(isNewUser);
    } catch (err: unknown) {
      setStep("METHOD_SELECT");

      if (err instanceof Error && err.message === "CUENTA_DESHABILITADA") {
        setError(
          "Acceso denegado. Su cuenta se encuentra deshabilitada. Contacte al soporte.",
        );
        await auth.signOut();
      } else if (err instanceof Error && err.message === "TOKEN_INVALIDO") {
        setError(
          "",
        );
        await auth.signOut();
      } else if (err instanceof TypeError) {
        setError(
          "No se pudo conectar con el servidor de Trego. ¿Está levantado el backend en el puerto 8080?",
        );
      } else if (err instanceof Error && err.message === "ERROR_SERVIDOR") {
        setError(
          "El servidor respondió con un error. Revisá la consola del backend (puerto 8080).",
        );
      } else if (
        err instanceof Error &&
        (err.message.includes("Firebase") || err.message.includes("auth/"))
      ) {
        setError(
          `Error de Firebase: ${err.message}. Copiá el firebaseConfig completo del proyecto trego-project en Firebase Console y reemplazá firebase.config.js (apiKey, appId, etc.).`,
        );
      } else if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError("No se pudo conectar con el servidor de Trego.");
      }
    }
  }

  // ── SMS — enviar código ────────────────────────────────────────────────────
  async function handleSendCode() {
    if (!phone.trim()) {
      setError("Ingresá tu número de teléfono.");
      return;
    }
    setError(null);
    setStep("LOADING");

    try {
      clearRecaptcha();

      // Configuramos el verificador apuntando al contenedor del DOM
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        // Este callback se asegura de que el token de reCAPTCHA esté listo
        callback: () => {
          console.log("reCAPTCHA resuelto con éxito");
        },
      });

      // Guardamos la referencia en el window
      window.recaptchaVerifier = verifier;

      //  Firebase espera el número en formato E.164.
      const formatted = phone.startsWith("+")
        ? phone
        : `+598${phone.replace(/^0/, "")}`;

      //  Disparamos la petición
      const result = await signInWithPhoneNumber(auth, formatted, verifier);

      //Actualizamos todo el estado JUNTO al final del flujo exitoso
      setConfirmation(result);
      setResendCooldown(60);
      setOtp("");

      //Esperamos un poco a que se envie el codigo y se cierre el captcha y mostramos campos para ingresar el codigo
      setTimeout(() => {
        setStep("SMS_CODE");
      }, 30);
    } catch (err: unknown) {
      clearRecaptcha();
      setStep("SMS_PHONE");
      const msg =
        err instanceof Error ? err.message : "No se pudo enviar el código.";
      setError(msg);
    }
  }

  // ------ SMS --- verificar código ------------
  async function handleVerifyCode() {
    if (otp.length !== 6) {
      setError("Ingresá el código de 6 dígitos.");
      return;
    }
    if (!confirmation) return;
    setError(null);
    setStep("LOADING");

    try {
      // Validamos el código de 6 dígitos con Firebase
      const result = await confirmation.confirm(otp);
      const { user } = result;

      // Extraemos el idToken que generó Firebase para este teléfono
      const idToken = await user.getIdToken();

      // Enviamos el token a nuestro backend usando el apiService
      const data = await apiAuth.loginConSMS(idToken);

      // Guardamos el JWT de Spring Boot (EL DEL BACKEND) en el navegador
      guardarSesion(data.token, data.rol);
      window.dispatchEvent(new Event("trego-sesion-iniciada"));

      // Evaluamos si es un usuario nuevo (Lo mismo que antes, tenemos que ver cual va a ser la condicion de comparacion)
      const isNewUser = !data.nombre || data.nombre === "";
      handlePostLogin(isNewUser);
    } catch (err: unknown) {
      // Manejo de errores de la API de Spring Boot
      if (err instanceof Error && err.message === "CUENTA_DESHABILITADA") {
        setError(
          "Acceso denegado. Su cuenta se encuentra deshabilitada. Contacte al soporte.",
        );
        setStep("METHOD_SELECT");
        await auth.signOut();
        return;
      }

      // Manejo de errores nativos de Firebase SMS (Código inválido/expirado)
      const msg = err instanceof Error ? err.message : "";
      const isCodeError =
        msg.includes("invalid-verification-code") ||
        msg.includes("expired-code") ||
        msg.includes("invalid-code");

      setError(
        isCodeError
          ? "El código es incorrecto o ha expirado."
          : "No se pudo conectar con el servidor de Trego.",
      );
      setStep("SMS_CODE");
    }
  }

  // ── Reenviar código ────────────────────────────────────────────────────────
  async function handleResend() {
    if (resendCooldown > 0) return;
    setOtp("");
    setStep("SMS_PHONE");
    // Volvemos a SMS_PHONE para que el usuario confirme el número y reenvíe
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Anchor invisible para reCAPTCHA */}
      <div id="recaptcha-container" />

      <Header menuUser={false}/>

      <main className="relative min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-10">
        <button
          type="button"
          onClick={() => navigate("/roles")}
          className="absolute left-4 top-4 sm:left-6 sm:top-6 flex items-center gap-1.5 rounded-full border-2 border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:border-orange-400 hover:text-orange-500 active:scale-95"
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
        <div className="flex w-full max-w-4xl rounded-3xl mb-5 overflow-hidden shadow-2xl shadow-orange-100 bg-white">
          {/* Panel izquierdo — marca */}
          <div className="hidden md:flex flex-col items-center justify-center bg-orange-500 w-5/12 h-130 p-10 gap-6">
            <div className="w-60 h-60 rounded-full bg-white/15 flex items-center justify-center shadow-inner mb-10">
              <img src={logo} />
            </div>
            <p className="text-white text-4xl font-bold tracking-tight text-center leading-tight">
              Lo Pedís, Trego
            </p>
          </div>

          {/* Panel derecho — formulario */}
          <div className="flex-1 flex flex-col justify-center px-8 md:px-14 py-12 gap-6">
            {/* Encabezado dinámico */}
            <div className="mb-10">
              {step === "METHOD_SELECT" && (
                <>
                  <h1 className="text-4xl font-bold text-center text-gray-800">
                    Bienvenido
                  </h1>
                </>
              )}
              {step === "SMS_PHONE" && (
                <>
                  <button
                    onClick={() => {
                      setStep("METHOD_SELECT");
                      setError(null);
                      setPhone("");
                    }}
                    className="text-orange-500 text-sm font-medium mb-3 flex items-center gap-1 hover:underline"
                  >
                    ← Volver
                  </button>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Ingresá tu número
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Te enviaremos un código de verificación
                  </p>
                </>
              )}
              {step === "SMS_CODE" && (
                <>
                  <button
                    onClick={() => {
                      setStep("SMS_PHONE");
                      setError(null);
                      setOtp("");
                    }}
                    className="text-orange-500 text-sm font-medium mb-3 flex items-center gap-1 hover:underline"
                  >
                    ← Volver
                  </button>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Código de verificación
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Enviamos un código al{" "}
                    <span className="font-semibold text-gray-700">{phone}</span>
                  </p>
                </>
              )}
              {step === "LOADING" && (
                <h1 className="text-2xl font-bold text-gray-800">
                  Verificando...
                </h1>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── Selección de método ── */}
            {step === "METHOD_SELECT" && (
              <div className="flex flex-col gap-8">
                <TextoDivider texto="Elegir método de inicio" />

                <button
                  onClick={handleGoogle}
                  className="
                    group flex items-center justify-center gap-3
                    w-full py-3.5 px-6 rounded-2xl border-2 border-gray-200
                    bg-white hover:border-orange-400 hover:bg-orange-50
                    transition-all duration-200 font-semibold text-gray-700
                    shadow-sm hover:shadow-md hover:shadow-orange-100
                  "
                >
                  <GoogleIcon />
                  Iniciar con Google
                </button>

                <button
                  onClick={() => {
                    setStep("SMS_PHONE");
                    setError(null);
                  }}
                  className="
                    group flex items-center justify-center gap-3
                    w-full py-3.5 px-6 rounded-2xl border-2 border-gray-200
                    bg-white hover:border-orange-400 hover:bg-orange-50
                    transition-all duration-200 font-semibold text-gray-700
                    shadow-sm hover:shadow-md hover:shadow-orange-100
                  "
                >
                  <SMSIcon />
                  Iniciar vía SMS
                </button>
              </div>
            )}

            {/* ── Ingreso de teléfono ── */}
            {step === "SMS_PHONE" && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Número de teléfono
                  </label>
                  <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200 focus-within:border-orange-400 transition-colors">
                    <span className="flex items-center px-4 bg-gray-50 text-gray-500 text-sm font-medium border-r border-gray-200 select-none">
                      +598
                    </span>
                    <input
                      type="tel"
                      placeholder="91 234 567"
                      value={phone}
                      onChange={(e) => {
                        // Permite que el usuario escriba con o sin prefijo
                        const val = e.target.value.replace(/[^\d\s\-+]/g, "");
                        setPhone(val);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                      className="flex-1 px-4 py-3.5 outline-none text-gray-800 text-sm bg-white placeholder:text-gray-300"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Ingresá el número sin el prefijo del país (ya incluido).
                  </p>
                </div>

                <button
                  onClick={handleSendCode}
                  className="
                    w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400
                    text-white font-bold text-sm tracking-wide
                    transition-all duration-200 shadow-lg shadow-orange-200
                    hover:shadow-xl hover:shadow-orange-300 active:scale-[0.98]
                  "
                >
                  Enviar código
                </button>
              </div>
            )}

            {/* ── Ingreso de código OTP ── */}
            {step === "SMS_CODE" && (
              <div className="flex flex-col gap-5">
                <OTPInput value={otp} onChange={setOtp} />

                <button
                  onClick={handleVerifyCode}
                  disabled={otp.length !== 6}
                  className="
                    w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600
                    text-white font-bold text-sm tracking-wide
                    transition-all duration-200 shadow-lg shadow-orange-200
                    hover:shadow-xl hover:shadow-orange-300 active:scale-[0.98]
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
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
                      onClick={handleResend}
                      className="text-orange-500 font-semibold hover:underline"
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
                <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
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

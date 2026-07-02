import { useState, useEffect } from "react";

import { auth, googleProvider } from "../../../firebase.config.js";
import {
  linkWithPopup,
  linkWithCredential,
  PhoneAuthProvider,
  RecaptchaVerifier,
} from "firebase/auth";
import type { User } from "firebase/auth";

import { apiAuth } from "../../api/apiAuth.js";
import OTPInput from "../inicio/OTPInput.js";
import { GoogleIcon, SMSIcon } from "../icons.jsx";
import type { DTOCliente } from "../../data/DTOCliente.js";

// El cliente tiene email cuando vinculó Google y teléfono cuando vinculó SMS.
// Mostramos cada método como "vinculado" o como acción disponible.
interface Props {
  cliente: DTOCliente;
  onVinculado: () => void | Promise<void>;
}

// Estado del sub-flujo SMS dentro del componente.
type SmsStep = "IDLE" | "PHONE" | "CODE";

declare global {
  interface Window {
    recaptchaVerifierLink?: RecaptchaVerifier | undefined;
  }
}

function limpiarRecaptcha() {
  if (window.recaptchaVerifierLink) {
    window.recaptchaVerifierLink.clear();
    window.recaptchaVerifierLink = undefined;
  }
}

// Traduce los códigos de error (del backend o de Firebase) a mensajes legibles.
function traducirError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";

  if (msg === "PROVEEDOR_EN_USO")
    return "Ese método ya está asociado a otra cuenta de Trego.";
  if (msg === "CUENTA_DESHABILITADA")
    return "Tu cuenta se encuentra deshabilitada. Contactá al soporte.";
  if (msg === "TOKEN_INVALIDO")
    return "No se pudo validar el método. Intentá de nuevo.";
  if (msg === "ERROR_SERVIDOR")
    return "El servidor respondió con un error. Intentá más tarde.";

  if (msg.includes("auth/credential-already-in-use"))
    return "Ese método ya está vinculado a otra cuenta de Firebase.";
  if (msg.includes("auth/provider-already-linked"))
    return "Ese método ya está vinculado a tu cuenta.";
  if (
    msg.includes("auth/invalid-verification-code") ||
    msg.includes("invalid-code")
  )
    return "El código es incorrecto o expiró.";
  if (msg.includes("auth/popup-closed-by-user"))
    return "Cerraste la ventana antes de completar la vinculación.";
  if (msg.includes("Firebase") || msg.includes("auth/"))
    return `Error de Firebase: ${msg}`;

  return "No se pudo vincular el método. Intentá de nuevo.";
}

// Devuelve el usuario de Firebase autenticado. La app vincula con
// linkWithCredential, por lo que ambos métodos comparten el mismo UID; aquí
// solo necesitamos que exista una sesión de Firebase activa.
async function asegurarUsuarioFirebase(): Promise<User> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) {
    throw new Error(
      "Necesitás haber iniciado sesión con Firebase para vincular un método.",
    );
  }
  return user;
}

export default function MetodosAcceso({ cliente, onVinculado }: Props) {
  const googleVinculado = !!cliente.email;
  const smsVinculado = !!cliente.telefono;

  const [smsStep, setSmsStep] = useState<SmsStep>("IDLE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [cargando, setCargando] = useState<null | "google" | "sms">(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  useEffect(() => () => limpiarRecaptcha(), []);

  // ── Google ────────────────────────────────────────────────────────────────
  async function handleVincularGoogle() {
    setError(null);
    setExito(null);
    setCargando("google");
    try {
      const user = await asegurarUsuarioFirebase();

      // Vincula el proveedor Google al mismo UID de Firebase.
      await linkWithPopup(user, googleProvider);

      // Token fresco que ya incluye el email recién vinculado.
      const token = await user.getIdToken(true);
      await apiAuth.vincularProveedor(token);

      setExito("Google vinculado correctamente.");
      await onVinculado();
    } catch (err: unknown) {
      setError(traducirError(err));
    } finally {
      setCargando(null);
    }
  }

  // ── SMS — enviar código ──────────────────────────────────────────────────
  async function handleEnviarCodigoSms() {
    if (!phone.trim()) {
      setError("Ingresá tu número de teléfono.");
      return;
    }
    setError(null);
    setExito(null);
    setCargando("sms");
    try {
      // Asegura que haya sesión Firebase antes de pedir el código.
      await asegurarUsuarioFirebase();

      // ojo: esto saltea el recaptcha para los numeros de prueba, sacar en prod
      auth.settings.appVerificationDisabledForTesting = true;

      limpiarRecaptcha();
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container-link", {
        size: "invisible",
      });
      window.recaptchaVerifierLink = verifier;

      const formatted = phone.startsWith("+")
        ? phone
        : `+598${phone.replace(/^0/, "")}`;

      const provider = new PhoneAuthProvider(auth);
      const id = await provider.verifyPhoneNumber(formatted, verifier);

      setVerificationId(id);
      setOtp("");
      setSmsStep("CODE");
    } catch (err: unknown) {
      limpiarRecaptcha();
      setError(traducirError(err));
    } finally {
      setCargando(null);
    }
  }

  // ── SMS — confirmar código y vincular ────────────────────────────────────
  async function handleConfirmarCodigoSms() {
    if (otp.length !== 6) {
      setError("Ingresá el código de 6 dígitos.");
      return;
    }
    if (!verificationId) return;
    setError(null);
    setExito(null);
    setCargando("sms");
    try {
      const user = await asegurarUsuarioFirebase();

      // Construye la credencial del teléfono y la vincula al mismo UID.
      const cred = PhoneAuthProvider.credential(verificationId, otp);
      await linkWithCredential(user, cred);

      const token = await user.getIdToken(true);
      await apiAuth.vincularProveedor(token);

      setExito("Teléfono vinculado correctamente.");
      setSmsStep("IDLE");
      setPhone("");
      setOtp("");
      setVerificationId(null);
      limpiarRecaptcha();
      await onVinculado();
    } catch (err: unknown) {
      setError(traducirError(err));
    } finally {
      setCargando(null);
    }
  }

  function cancelarSms() {
    setSmsStep("IDLE");
    setPhone("");
    setOtp("");
    setVerificationId(null);
    setError(null);
    limpiarRecaptcha();
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 mt-6">
      {/* Anchor invisible para reCAPTCHA */}
      <div id="recaptcha-container-link" />

      <h2 className="text-lg font-bold text-slate-800">Métodos de acceso</h2>
      <p className="text-sm text-slate-500 mt-1">
        Vinculá ambos métodos para poder ingresar por Google y por SMS.
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {exito && (
        <div className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {exito}
        </div>
      )}

      {/* ── Google ── */}
      <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <GoogleIcon />
          <div>
            <p className="text-sm font-semibold text-slate-800">Google</p>
            <p className="text-xs text-slate-500">
              {googleVinculado ? cliente.email : "Sin vincular"}
            </p>
          </div>
        </div>
        {googleVinculado ? (
          <span className="text-xs font-semibold text-green-600 bg-green-50 rounded-full px-3 py-1">
            Vinculado
          </span>
        ) : (
          <button
            onClick={handleVincularGoogle}
            disabled={cargando !== null}
            className="text-sm font-semibold text-trego-orange hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cargando === "google" ? "Vinculando..." : "Vincular"}
          </button>
        )}
      </div>

      {/* ── SMS ── */}
      <div className="mt-3 rounded-xl border border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SMSIcon />
            <div>
              <p className="text-sm font-semibold text-slate-800">Teléfono</p>
              <p className="text-xs text-slate-500">
                {smsVinculado ? cliente.telefono : "Sin vincular"}
              </p>
            </div>
          </div>
          {smsVinculado ? (
            <span className="text-xs font-semibold text-green-600 bg-green-50 rounded-full px-3 py-1">
              Vinculado
            </span>
          ) : (
            smsStep === "IDLE" && (
              <button
                onClick={() => {
                  setSmsStep("PHONE");
                  setError(null);
                  setExito(null);
                }}
                disabled={cargando !== null}
                className="text-sm font-semibold text-trego-orange hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Vincular
              </button>
            )
          )}
        </div>

        {/* Sub-flujo: ingresar teléfono */}
        {!smsVinculado && smsStep === "PHONE" && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex rounded-xl overflow-hidden border-2 border-slate-200 focus-within:border-trego-orange transition-colors">
              <span className="flex items-center px-3 bg-slate-50 text-slate-500 text-sm font-medium border-r border-slate-200 select-none">
                +598
              </span>
              <input
                type="tel"
                placeholder="91 234 567"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/[^\d\s\-+]/g, ""))
                }
                onKeyDown={(e) => e.key === "Enter" && handleEnviarCodigoSms()}
                className="flex-1 px-3 py-2.5 outline-none text-slate-800 text-sm bg-white placeholder:text-slate-300"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEnviarCodigoSms}
                disabled={cargando !== null}
                className="flex-1 py-2.5 rounded-xl bg-trego-orange hover:opacity-90 text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cargando === "sms" ? "Enviando..." : "Enviar código"}
              </button>
              <button
                onClick={cancelarSms}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Sub-flujo: ingresar código */}
        {!smsVinculado && smsStep === "CODE" && (
          <div className="mt-4 flex flex-col gap-3">
            <OTPInput value={otp} onChange={setOtp} />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmarCodigoSms}
                disabled={otp.length !== 6 || cargando !== null}
                className="flex-1 py-2.5 rounded-xl bg-trego-orange hover:opacity-90 text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cargando === "sms" ? "Vinculando..." : "Confirmar"}
              </button>
              <button
                onClick={cancelarSms}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

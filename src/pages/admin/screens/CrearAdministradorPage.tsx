import { useState } from "react";
import { TextInput } from "../../../components/TextInput.js";
import { administradorApi } from "../../../api/administradorApi.js";
import { esEmailValido } from "../../../utils/validarEmail.js";
import AdminPageShell, { AdminPageHeader } from "../components/AdminPageShell.js";

export default function CrearAdministradorPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const limpiarFormulario = () => {
    setNombre("");
    setEmail("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);

    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim();

    if (!nombreLimpio) {
      setError("Ingresá el nombre del administrador.");
      return;
    }

    if (!emailLimpio) {
      setError("Ingresá el correo electrónico.");
      return;
    }

    if (!esEmailValido(emailLimpio)) {
      setError("Ingresá un correo electrónico válido.");
      return;
    }

    setEnviando(true);

    try {
      const mensaje = await administradorApi.crearAdministrador({
        nombre: nombreLimpio,
        email: emailLimpio,
      });

      setMensajeExito(
        `${mensaje} Se enviaron las credenciales de acceso al correo indicado.`,
      );
      limpiarFormulario();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el administrador. Intentá de nuevo.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AdminPageShell>
    <div className="mx-auto w-full max-w-xl">
      <AdminPageHeader
        titulo="Crear administrador"
        descripcion="Generá una cuenta de administrador. El sistema enviará las credenciales de acceso al correo indicado."
        centrado
      />

      {mensajeExito && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm">
          {mensajeExito}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm"
      >
        <div className="space-y-5">
          <TextInput
            id="nombre-admin"
            placeholder="Nombre completo"
            type="text"
            value={nombre}
            onChange={setNombre}
            label
            colorStyle="text-orange-500"
          />

          <TextInput
            id="email-admin"
            placeholder="Correo electrónico"
            type="email"
            value={email}
            onChange={setEmail}
            label
            colorStyle="text-orange-500"
          />
        </div>

        <p className="mt-5 text-sm text-gray-500">
          La contraseña se genera automáticamente y se envía por correo. El nuevo
          administrador podrá cambiarla desde su perfil luego de iniciar sesión.
        </p>

        <button
          type="submit"
          disabled={enviando}
          className="mt-6 w-full rounded-xl bg-trego-admin px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? "Creando..." : "Crear administrador"}
        </button>
      </form>
    </div>
    </AdminPageShell>
  );
}

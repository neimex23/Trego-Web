import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  TextInput,
  type SeguridadPassword,
} from "../../components/TextInput.js";
import {
  actualizarContraseña,
  obtenerUsuarioActual,
} from "../../api/usuariosApi.js";

type TipoLogin = "Administrador" | "Restaurante";

interface CambiarContraseñaPageProps {
  tipo: TipoLogin;
  volverPath: string;
}

const CONFIG: Record<
  TipoLogin,
  {
    colorStyle: string;
    btnBg: string;
    btnHover: string;
    linkColor: string;
  }
> = {
  Administrador: {
    colorStyle: "trego-admin",
    btnBg: "bg-trego-admin",
    btnHover: "hover:bg-blue-700",
    linkColor: "text-trego-admin",
  },
  Restaurante: {
    colorStyle: "trego-restaurante",
    btnBg: "bg-trego-restaurante",
    btnHover: "hover:bg-green-700",
    linkColor: "text-trego-restaurante",
  },
};

type Paso = "CARGA" | "FORM" | "GUARDANDO" | "EXITO";

export default function CambiarContraseñaPage({
  tipo,
  volverPath,
}: CambiarContraseñaPageProps) {
  const navigate = useNavigate();
  const cfg = CONFIG[tipo];

  const rutaVolver =
    tipo === "Restaurante" &&
    localStorage.getItem("restauranteHabilitado") !== "true"
      ? "/restaurantes/solicitarAlta"
      : volverPath;

  const [paso, setPaso] = useState<Paso>("CARGA");
  const [email, setEmail] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [seguridad, setSeguridad] = useState<SeguridadPassword>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     obtenerUsuarioActual()
      .then((usuario) => {
        setEmail(usuario.email ?? "");
        setPaso("FORM");
      })
      .catch(() => {
        setError("No se pudieron cargar los datos de tu cuenta.");
        setPaso("FORM");
      });
  }, []);

  const guardar = async () => {
    if (nueva.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (
      !seguridad ||
      seguridad === "Debil" ||
      seguridad === "Regular"
    ) {
      setError(
        "La contraseña es demasiado débil. Usá al menos 8 caracteres, mayúsculas y números.",
      );
      return;
    }
    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setError(null);
    setPaso("GUARDANDO");

    try {
      await actualizarContraseña(nueva);
      setPaso("EXITO");
    } catch (err: unknown) {
      setPaso("FORM");
      if (err instanceof Error) {
        switch (err.message) {
          case "SESION_EXPIRADA":
            setError("Tu sesión expiró. Volvé a iniciar sesión.");
            break;
          case "La contraseña debe tener al menos 8 caracteres.":
            setError(err.message);
            break;
          default:
            setError(
              err.message && err.message !== "ERROR_SERVIDOR"
                ? err.message
                : "No se pudo actualizar la contraseña.",
            );
        }
      } else {
        setError("Ocurrió un error inesperado.");
      }
    }
  };

  if (paso === "CARGA") {
    return (
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8 min-h-0">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-start justify-center p-3 sm:p-6 md:p-10 min-h-0 overflow-y-auto">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Cambiar contraseña</h1>
        <p className="mt-2 text-sm text-gray-500">
          Actualizá la contraseña de tu cuenta de {tipo.toLowerCase()}.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex gap-2">
            <span className="shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {paso === "EXITO" ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-800">
              Tu contraseña se actualizó correctamente.
            </div>
            <button
              type="button"
              onClick={() => navigate(rutaVolver)}
              className={`w-full py-3 rounded-2xl ${cfg.btnBg} ${cfg.btnHover} text-white font-semibold`}
            >
              Volver
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-5">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Cuenta
              </label>
              <p className="mt-1 text-gray-800 font-medium">{email || "—"}</p>
            </div>

            <TextInput
              value={nueva}
              onChange={setNueva}
              placeholder="Nueva contraseña"
              type="password"
              colorStyle={cfg.colorStyle}
              showStrength
              onChangeSeguridad={setSeguridad}
            />

            <TextInput
              value={confirmar}
              onChange={setConfirmar}
              placeholder="Confirmar nueva contraseña"
              type="password"
              colorStyle={cfg.colorStyle}
            />

            <button
              type="button"
              onClick={guardar}
              disabled={paso === "GUARDANDO"}
              className={`w-full py-3.5 rounded-2xl ${cfg.btnBg} ${cfg.btnHover} text-white font-semibold disabled:opacity-60`}
            >
              {paso === "GUARDANDO" ? "Guardando..." : "Guardar contraseña"}
            </button>

            <Link
              to={rutaVolver}
              className={`text-center text-sm ${cfg.linkColor} hover:underline`}
            >
              Cancelar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import ImagenUploadField from "../../../components/ImagenUploadField.js";
import { TextInput } from "../../../components/TextInput.js";
import { TextSelector } from "../../../components/TextSelector.js";
import { administradorApi, type CategoriaProducto } from "../../../api/administradorApi.js";
import type { ImageField } from "../../../components/typos/ImageField.js";
import AdminPageShell, { AdminPageHeader } from "../components/AdminPageShell.js";

const CATEGORIAS: CategoriaProducto[] = [
  "Bebida",
  "Ensalada",
  "Principal",
  "Entrada",
  "Guarnicion",
  "Postre",
  "Otros",
];

type Estado = "idle" | "cargando" | "exito" | "error";

export default function AltaSubCategoriaPage() {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<CategoriaProducto>("Principal");
  const [foto, setFoto] = useState<ImageField>({
    file: null,
    previewUrl: null,
    cloudUrl: null,
    uploadState: "idle",
  });
  const [estado, setEstado] = useState<Estado>("idle");
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    nombre?: string;
    foto?: string;
    categoria?: string;
  }>({});

  const handleImageChange = (file: File) => {
    if (foto.previewUrl) URL.revokeObjectURL(foto.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    setFoto({ file, previewUrl, uploadState: "idle", cloudUrl: null });
  };

  const validar = () => {
    const e: typeof errors = {};
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!foto.file) e.foto = "La imagen es obligatoria";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validar()) return;
    setEstado("cargando");
    setMensajeError(null);

    try {
      await administradorApi.crearSubCategoria(nombre.trim(), categoria, foto.file!);
      setEstado("exito");
      setNombre("");
      setCategoria("Principal");
      setFoto({ file: null, previewUrl: null, cloudUrl: null, uploadState: "idle" });
      setErrors({});
    } catch (err) {
      setEstado("error");
      if (err instanceof Error) {
        setMensajeError(
          err.message === "ERROR_DUPLICADO"
            ? "Ya existe una subcategoría con ese nombre."
            : "Error al crear la subcategoría. Intentá de nuevo."
        );
      }
    }
  };

  return (
    <AdminPageShell>
    <div className="mx-auto w-full max-w-md flex flex-col gap-4">
      <AdminPageHeader
        titulo="Nueva subcategoría"
        descripcion="Creá una subcategoría para organizar los productos del menú."
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Nombre</span>
        <TextInput
        placeholder="Nombre de la subcategoría"
        value={nombre}
        onChange={(v) => setNombre(v)}
        {...(errors.nombre ? { error: errors.nombre } : {})}
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Categoría</span>
        <TextSelector
        items={CATEGORIAS}
        selected={categoria}
        onSelect={(v) => { if (v) setCategoria(v); }}
        mapToItem={(c) => ({ id: c, label: c })}
        placeholder="Seleccioná una categoría"
        {...(errors.categoria ? { error: errors.categoria } : {})}
        />
      </div>

        <ImagenUploadField
        label="Imagen"
        imageField={foto}
        onImageChange={handleImageChange}
        hasError={!!errors.foto}
        {...(errors.foto ? { errorMessage: errors.foto } : {})}
        />

      {estado === "exito" && (
        <p className="text-green-600 font-medium">
          ¡Subcategoría creada correctamente!
        </p>
      )}

      {estado === "error" && mensajeError && (
        <p className="text-red-600 font-medium">{mensajeError}</p>
      )}

        <button
        onClick={handleSubmit}
        disabled={estado === "cargando"}
        className="mt-6 w-full rounded-xl bg-trego-admin px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
        {estado === "cargando" ? "Creando..." : "Crear subcategoría"}
        </button>
    </div>
    </AdminPageShell>
  );
}
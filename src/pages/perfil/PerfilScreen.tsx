import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Edit2,
  Save,
  X,
  Plus,
  MapPin,
  Phone,
  Mail,
  Lock,
} from "lucide-react";
import DireccionCard from "../../components/cliente/DireccionCard.js";
import DireccionForm from "../../components/cliente/DireccionForm.js";
import MetodosAcceso from "../../components/cliente/MetodosAcceso.js";
import { useCliente } from "../../hooks/useCliente.js";
import type { DTODireccion } from "../../data/DTODireccion.js";
import {
  actualizarDireccionApi,
  actualizarPerfil,
  agregarDireccionApi,
} from "../../api/apiPerfil.js";
import type { UploadState } from "../../components/typos/ImageField.js";
import { obtenerFirmaCloudinary } from "../../api/apiRestaurante.js";
import { getInitials } from "../../utils/funcionesFormateo.js";
import { obtenerThumbnail } from "../restaurantes/utilitis/cloudinaryUtilitis.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateTelefono(tel: string): boolean {
  const digits = tel.replace(/\D/g, "");
  return digits.length >= 11 && digits.startsWith("598");
}

const emptyDireccion: DTODireccion = {
  calle: "",
  numero: "",
  tag: "",
  apartamento: "",
  esquina: "",
  latitud: 0,
  longitud: 0,
};

export default function PerfilCliente() {
  const { cliente, setCliente, recargar, error, loading } = useCliente({
    onError: (msg) => console.error(msg), // o tu notificación
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    nombre: "",
    telefono: "",
    email: "",
    urlImagen: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAddressId, setActiveAddressId] = useState<string | null>(null);
  const [direccionDraft, setDireccionDraft] = useState(emptyDireccion);
  const showAddressForm = activeAddressId !== null;
  const [direccionError, setDireccionError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Manejar carga de imagenes
  const [imageUpload, setImageUpload] = useState<{
    file: File | null;
    previewUrl: string | null;
    cloudUrl: string | null;
    state: UploadState;
  }>({
    file: null,
    previewUrl: null,
    cloudUrl: null,
    state: "idle",
  });
  const [imageError, setImageError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    iniciarSubidaImagen(file);
  };

  async function iniciarSubidaImagen(file: File) {
    setImageError(null);

    // Liberar preview anterior
    if (imageUpload.previewUrl) {
      URL.revokeObjectURL(imageUpload.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);

    // Actualizamos el draft para que la preview se vea al instante
    setProfileDraft((p) => ({ ...p, urlImagen: previewUrl }));

    setImageUpload({
      file,
      previewUrl,
      cloudUrl: null,
      state: "uploading",
    });

    try {
      const nombreSinExtension =
        file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      const datosBack = await obtenerFirmaCloudinary(
        nombreSinExtension,
        "image",
      );

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", datosBack.apiKey);
      formData.append("timestamp", datosBack.timestamp.toString());
      formData.append("signature", datosBack.firma);
      formData.append("public_id", datosBack.publicId);

      const cloudinaryRes = await fetch(datosBack.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!cloudinaryRes.ok) throw new Error("Cloudinary rechazó la imagen");

      const cloudinaryData = await cloudinaryRes.json();
      const cloudUrl = cloudinaryData.secure_url;

      // Éxito: actualizamos draft con la URL definitiva de Cloudinary
      setProfileDraft((p) => ({ ...p, urlImagen: cloudUrl }));
      setImageUpload((prev) => ({
        ...prev,
        state: "done",
        cloudUrl,
      }));
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      // Revertimos la preview a la imagen original (o la anterior)
      setProfileDraft((p) => ({
        ...p,
        urlImagen: cliente?.urlImagen ?? "",
      }));
      setImageError("No se pudo subir la imagen. Intentalo de nuevo.");
      setImageUpload((prev) => ({
        ...prev,
        state: "error",
      }));
    }
  }

  // Efecto: cuando se activa la edición o cambia el usuario, rellenamos draft
  useEffect(() => {
    if (cliente && isEditingProfile) {
      setProfileDraft({
        nombre: cliente.nombre ?? "",
        telefono: cliente.telefono ?? "",
        email: cliente.email ?? "",
        urlImagen: cliente.urlImagen ?? "",
      });
    }
  }, [cliente, isEditingProfile]);

  // ── Manejadores de perfil ──────────────────────────────────────────────
  const handleEditProfile = () => setIsEditingProfile(true);
  const handleCancelProfile = () => {
    if (imageUpload.previewUrl) {
      URL.revokeObjectURL(imageUpload.previewUrl);
    }
    setImageUpload({
      file: null,
      previewUrl: null,
      cloudUrl: null,
      state: "idle",
    });
    setProfileDraft((p) => ({ ...p, urlImagen: cliente?.urlImagen ?? "" }));
    setImageError(null);
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (imageUpload.state === "uploading") {
      setProfileError("Esperá a que la imagen termine de subir.");
      return;
    }
    setProfileError(null);
    setSavingProfile(true);

    try {
      const payload: Record<string, string> = {};
      if (profileDraft.nombre !== cliente?.nombre)
        payload.nombre = profileDraft.nombre;
      if (profileDraft.telefono !== cliente?.telefono)
        payload.telefono = profileDraft.telefono;
      if (!emailExists && profileDraft.email)
        payload.email = profileDraft.email;

      if (!validateTelefono(profileDraft.telefono)) {
        setProfileError(
          "El teléfono debe tener al menos 11 dígitos y comenzar con 598.",
        );
        return;
      }

      // Solo enviamos la imagen si realmente cambió (comparamos con la original o si hay cloudUrl nueva)
      if (profileDraft.urlImagen !== cliente?.urlImagen) {
        payload.urlImagen = profileDraft.urlImagen;
      }

      if (Object.keys(payload).length === 0) {
        setIsEditingProfile(false);
        return;
      }

      const usuarioActualizado = await actualizarPerfil(payload);
      recargar();
      setIsEditingProfile(false);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Error al guardar los cambios",
      );
    } finally {
      setSavingProfile(false);
    }
  };
  // --- Manejadores de direcciones ---
  const handleAddDireccion = () => {
    setDireccionError(null);
    setDireccionDraft(emptyDireccion);
    setActiveAddressId("NEW");
  };

  const handleEditDireccion = (d: DTODireccion, index: number) => {
    setDireccionError(null);
    setDireccionDraft({
      calle: d.calle ?? "",
      numero: d.numero ?? "",
      tag: d.tag ?? "",
      apartamento: d.apartamento ?? "",
      esquina: d.esquina ?? "",
      latitud: d.latitud ?? 0, // Corregido: de "" a 0
      longitud: d.longitud ?? 0, // Corregido: de "" a 0
    });
    setActiveAddressId(d.tag || `empty-${index}`);
  };

  const handleCancelDireccion = () => {
    setDireccionError(null);
    setActiveAddressId(null);
  };

  const handleSaveDireccion = async () => {
    console.log("EN el id ese hay:", activeAddressId);
    setDireccionError(null);
    try {
      if (activeAddressId === "NEW") {
        await agregarDireccionApi(direccionDraft);
      } else {
        await actualizarDireccionApi(
          activeAddressId as string,
          direccionDraft,
          true,
        );
      }

      setActiveAddressId(null);
      await recargar();
    } catch (error) {
      setDireccionError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al guardar.",
      );
    }
  };

  if (loading)
    return <div className="text-center py-20">Cargando perfil...</div>;
  if (error)
    return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!cliente)
    return (
      <div className="text-center py-20 text-red-500">
        Cliente no encontrado
      </div>
    );

  // Datos reales
  const avatarSrc = isEditingProfile
    ? profileDraft.urlImagen
    : cliente?.urlImagen;
  const nombreMostrado = cliente?.nombre ?? "Sin nombre";
  const email = cliente?.email;
  const telefono = cliente?.telefono;
  const emailExists = !!email;

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page title */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-center text-slate-900 tracking-tight">
            Mi perfil
          </h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Gestioná tu información personal y tus direcciones de entrega
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Columna izquierda: tarjeta de perfil */}
          <div className="w-full lg:w-82 xl:w-110 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-20 bg-linear-to-br from-trego-orange to-trego-orange/80" />

              <div className="flex flex-col items-center px-6 pb-6 -mt-10">
                {isEditingProfile && profileError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 animate-in fade-in">
                    <X size={14} className="text-red-500 mt-0.5" />
                    <p className="text-sm text-red-600">{profileError}</p>
                  </div>
                )}
                <div className="relative group mb-3">
                  <div className="w-20 h-20 rounded-full bg-orange-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                    {avatarSrc ? (
                      <img
                        src={obtenerThumbnail(avatarSrc)}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-trego-orange/80">
                        {getInitials(nombreMostrado)}
                      </span>
                    )}
                  </div>
                  {isEditingProfile && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageUpload.state === "uploading"}
                        title="Cambiar foto"
                        className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {imageUpload.state === "uploading" ? (
                          <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Camera size={18} className="text-white" />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      {imageError && (
                        <p className="text-xs text-red-500 mt-1">
                          {imageError}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Nombre */}
                {!isEditingProfile ? (
                  <div className="text-center mb-4">
                    <h2 className="font-bold text-slate-900 p-2 text-lg leading-snug">
                      {nombreMostrado}
                    </h2>
                  </div>
                ) : (
                  <div className="w-full mb-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1 text-left">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={profileDraft.nombre}
                      onChange={(e) =>
                        setProfileDraft((p) => ({
                          ...p,
                          nombre: e.target.value,
                        }))
                      }
                      placeholder="Nombre completo"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-shadow"
                    />
                  </div>
                )}

                <div className="w-full border-t border-slate-100 mb-4" />

                {/* Email */}
                <div className="w-full space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <Mail size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
                        Email
                      </p>
                      {isEditingProfile && !emailExists ? (
                        <input
                          type="email"
                          value={profileDraft.email}
                          onChange={(e) =>
                            setProfileDraft((p) => ({
                              ...p,
                              email: e.target.value,
                            }))
                          }
                          placeholder="correo@ejemplo.com"
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-shadow"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm text-slate-700 truncate">
                            {email ?? (
                              <span className="text-slate-400 italic">
                                Sin email
                              </span>
                            )}
                          </p>
                          {isEditingProfile && emailExists && (
                            <Lock
                              size={11}
                              className="text-slate-300 shrink-0"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <Phone size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
                        Teléfono
                      </p>
                      {isEditingProfile ? (
                        <input
                          type="tel"
                          value={profileDraft.telefono}
                          onChange={(e) =>
                            setProfileDraft((p) => ({
                              ...p,
                              telefono: e.target.value,
                            }))
                          }
                          placeholder="+598 99 000 000"
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-shadow"
                        />
                      ) : (
                        <p className="text-sm text-slate-700">
                          {telefono ?? (
                            <span className="text-slate-400 italic">
                              Sin teléfono
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de editar/guardar */}
                <div className="w-full mt-6">
                  {!isEditingProfile ? (
                    <button
                      onClick={handleEditProfile}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-trego-orange hover:bg-trego-cart active:bg-trego-orange text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      <Edit2 size={14} /> Editar perfil
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-trego-orange hover:bg-trego-cart text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-70"
                      >
                        {savingProfile ? (
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                        {savingProfile ? "Guardando…" : "Guardar"}
                      </button>
                      <button
                        onClick={handleCancelProfile}
                        className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Métodos de acceso: vincular Google / SMS */}
            {cliente && (
              <MetodosAcceso cliente={cliente} onVinculado={recargar} />
            )}
          </div>

          {/* Columna derecha: direcciones */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Mis direcciones
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {cliente?.direcciones?.length === 0
                      ? "Ninguna guardada aún"
                      : `${cliente?.direcciones?.length} dirección${cliente?.direcciones?.length !== 1 ? "es" : ""} guardada${cliente?.direcciones?.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
                {!showAddressForm && (
                  <button
                    onClick={handleAddDireccion}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-trego-orange hover:bg-trego-cart text-white rounded-xl text-sm font-medium transition-colors shrink-0"
                  >
                    <Plus size={15} /> Agregar
                  </button>
                )}
              </div>

              {direccionError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <X size={12} className="text-red-600 font-bold" />
                  </div>
                  <p className="text-sm text-red-600 font-medium leading-relaxed">
                    {direccionError}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {cliente?.direcciones?.length === 0 && !showAddressForm && (
                  <div className="text-center py-14">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <MapPin size={24} className="text-slate-300" />
                    </div>
                    <p className="font-semibold text-slate-500 text-sm">
                      No tenés direcciones guardadas
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Agregá una para agilizar tus pedidos
                    </p>
                  </div>
                )}

                {activeAddressId === "NEW" && (
                  <DireccionForm
                    draft={direccionDraft}
                    onChange={setDireccionDraft}
                    onSave={handleSaveDireccion}
                    onCancel={handleCancelDireccion}
                    mode="new"
                    direcciones={cliente?.direcciones ?? []}
                    originalTag={direccionDraft.tag}
                  />
                )}

                {cliente?.direcciones?.map((d, index) => {
                  const uniqueId = d.tag || `empty-${index}`;
                  return activeAddressId === uniqueId ? (
                    <DireccionForm
                      key={uniqueId}
                      draft={direccionDraft}
                      onChange={setDireccionDraft}
                      onSave={handleSaveDireccion}
                      onCancel={handleCancelDireccion}
                      mode="edit"
                      direcciones={cliente?.direcciones ?? []}
                      originalTag={direccionDraft.tag}
                    />
                  ) : (
                    <DireccionCard
                      key={uniqueId}
                      direccion={d}
                      onEdit={() => handleEditDireccion(d, index)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

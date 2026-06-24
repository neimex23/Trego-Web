import { useState, useRef } from "react";
import {
  Camera,
  Edit2,
  Save,
  X,
  Lock,
  MapPin,
  Phone,
  Mail,
  Tag,
  Truck,
  Star,
  Clock,
  Loader2,
} from "lucide-react";
import {
  formatAddressLine,
  getInitials,
} from "../../utils/funcionesFormateo.js";
import type { DTORestaurante } from "../../data/DTORestaurante.js";
import { useRestauranteActual } from "../../hooks/useRestauranteActual.js";
import { EnumCategoriaRestaurante } from "../../data/CategoriaRestaurante.js";
import { CATEGORIAS_RESTAURANTE } from "../../constants/categorias.js";
import type { UploadState } from "../../components/typos/ImageField.js";
import {
  obtenerFirmaCloudinary,
  modificarRestaurantePerfil,
} from "../../api/apiRestaurante.js";
import {
  obtenerBannerPortada,
  obtenerThumbnail,
} from "../restaurantes/utilitis/cloudinaryUtilitis.js";

function formatTime(t?: string | null): string {
  return t?.slice(0, 5) ?? "";
}

// ─── StarRating ───────────────────────────────────────────────────────────────

interface StarRatingProps {
  value: number | null | undefined;
}

function StarRating({ value }: StarRatingProps) {
  const full = Math.floor(value ?? 0);
  const half = (value ?? 0) - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={11}
          fill={i < full || (i === full && half) ? "#F59E0B" : "none"}
          stroke={i < full || (i === full && half) ? "#F59E0B" : "#D1D5DB"}
          strokeWidth={1.5}
        />
      ))}
      <span className="text-xs font-semibold text-slate-500 ml-1">
        {value?.toFixed(1)}
      </span>
    </span>
  );
}

interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value?: string | undefined;
  locked?: boolean;
  isEditing?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  inputType?: string;
}

function InfoField({
  icon,
  label,
  value,
  locked = false,
  isEditing = false,
  onChange,
  placeholder = "No disponible",
  inputType = "text",
}: InfoFieldProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400">
          {icon}
        </div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {label}
        </span>
        {locked && <Lock size={10} className="text-slate-300" />}
      </div>

      {isEditing && !locked ? (
        <div className="pl-9">
          <input
            type={inputType}
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 bg-white focus:outline-none focus:ring-[3px] focus:ring-[#1B6B3A]/25 transition-shadow"
          />
        </div>
      ) : (
        <p className="text-sm text-slate-700 pl-9 leading-snug">
          {value || (
            <span className="italic text-slate-400">{placeholder}</span>
          )}
        </p>
      )}
    </div>
  );
}

export default function PerfilRestaurante() {
  const { restaurante, loading, error, recargar } = useRestauranteActual({
    onError: (msg: string) => console.error(msg),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [restauranteEdit, setRestauranteEdit] = useState<DTORestaurante>({});

  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);

  // ── Constantes del slider ─────────────────────────────────────────────────
  const SLIDER_MIN = 1;
  const SLIDER_MAX = 40;
  const radioActual =
    restauranteEdit?.radioEntrega ?? restaurante?.radioEntrega ?? 5;
  const sliderPct =
    ((radioActual - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  // ── Estado para subida de imágenes ───────────────────────────────────────
  interface ImageUploadState {
    field: "fotoPerfil" | "fotoPortada" | null;
    file: File | null;
    previewUrl: string | null;
    cloudUrl: string | null;
    state: UploadState;
  }
  const [imageUpload, setImageUpload] = useState<ImageUploadState>({
    field: null,
    file: null,
    previewUrl: null,
    cloudUrl: null,
    state: "idle",
  });
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Handlers de imagen ---
  const handleFileSelect =
    (field: "fotoPerfil" | "fotoPortada") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      iniciarSubidaImagen(file, field);
    };

  async function iniciarSubidaImagen(
    file: File,
    field: "fotoPerfil" | "fotoPortada",
  ) {
    setImageError(null);
    if (imageUpload.previewUrl) {
      URL.revokeObjectURL(imageUpload.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setRestauranteEdit((prev) => ({ ...prev, [field]: previewUrl }));
    setImageUpload({
      field,
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

      setRestauranteEdit((prev) => ({ ...prev, [field]: cloudUrl }));
      setImageUpload((prev) => ({ ...prev, state: "done", cloudUrl }));
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      setRestauranteEdit((prev) => ({
        ...prev,
        [field]: restaurante?.[field] ?? prev[field] ?? "",
      }));
      setImageError("No se pudo subir la imagen. Intentalo de nuevo.");
      setImageUpload((prev) => ({ ...prev, state: "error" }));
    }
  }

  // --- Handlers de edición ---
  const handleEdit = () => {
    setRestauranteEdit({
      ...restaurante,
      telefono: restaurante?.telefono ?? "",
      fotoPerfil: restaurante?.fotoPerfil ?? "",
      fotoPortada: restaurante?.fotoPortada ?? "",
      descripcion: restaurante?.descripcion ?? "",
      categoria: restaurante?.categoria ?? EnumCategoriaRestaurante.Otros,
      radioEntrega: restaurante?.radioEntrega ?? 5,
      horaApertura: restaurante?.horaApertura ?? "",
      horaCierre: restaurante?.horaCierre ?? "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (imageUpload.previewUrl) URL.revokeObjectURL(imageUpload.previewUrl);
    setImageUpload({
      field: null,
      file: null,
      previewUrl: null,
      cloudUrl: null,
      state: "idle",
    });
    setImageError(null);
    setRestauranteEdit({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (imageUpload.state === "uploading") {
      alert("Esperá a que la imagen termine de subir.");
      return;
    }

    setIsSaving(true);
    try {
      console.log("Esto es lo que manda: ", restauranteEdit);
      await modificarRestaurantePerfil(restauranteEdit);
      if (recargar) {
        await recargar();
      }
      setIsEditing(false);
      setRestauranteEdit({});
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("Hubo un error al guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Datos derivados ---
  const coverSrc = isEditing
    ? restauranteEdit?.fotoPortada
    : restaurante?.fotoPortada;
  const profileSrc = isEditing
    ? restauranteEdit?.fotoPerfil
    : restaurante?.fotoPerfil;
  const categoria = isEditing
    ? restauranteEdit?.categoria
    : restaurante?.categoria;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Cargando perfil...</p>
      </div>
    );
  }

  if (error && !restaurante) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 p-4 lg:p-8 pb-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-center text-slate-900 tracking-tight">
            Mi Perfil
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative h-48 sm:h-64 md:h-75 border-2 border-trego-restaurante rounded-t-2xl">
            {coverSrc ? (
              <img
                src={obtenerBannerPortada(coverSrc)}
                alt="Portada"
                className="w-full h-full object-cover rounded-t-xl"
              />
            ) : (
              <div
                className="w-full h-full flex items-end p-5 overflow-hidden bg-[#1B6B3A] rounded-t-xl"
                style={{
                  background:
                    "linear-gradient(135deg, #145530 0%, #1B6B3A 50%, #27894C 100%)",
                }}
              >
                {[18, 36, 28, 44, 22, 50, 32, 40, 26, 38].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t mr-0.5"
                    style={{
                      height: h * 2,
                      background: `rgba(255,255,255,${0.04 + (i % 4) * 0.025})`,
                    }}
                  />
                ))}
              </div>
            )}

            {isEditing && (
              <>
                <button
                  onClick={() => coverPhotoRef.current?.click()}
                  disabled={
                    imageUpload.state === "uploading" &&
                    imageUpload.field === "fotoPortada"
                  }
                  className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2
                             opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer rounded-t-xl"
                >
                  {imageUpload.state === "uploading" &&
                  imageUpload.field === "fotoPortada" ? (
                    <Loader2 size={28} className="text-white animate-spin" />
                  ) : (
                    <Camera size={28} className="text-white" />
                  )}
                  <span className="text-white text-sm font-medium">
                    Cambiar portada
                  </span>
                </button>
                <input
                  ref={coverPhotoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect("fotoPortada")}
                />
              </>
            )}
          </div>

          <div className="px-5 sm:px-6 pb-6 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 mb-4">
              <div className="relative group shrink-0 -mt-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-md bg-[#EAF3EE] flex items-center justify-center overflow-hidden">
                  {profileSrc ? (
                    <img
                      src={obtenerThumbnail(profileSrc)}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-[#1B6B3A] leading-none">
                      {getInitials(restaurante?.nombre ?? "")}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <>
                    <button
                      onClick={() => profilePhotoRef.current?.click()}
                      disabled={
                        imageUpload.state === "uploading" &&
                        imageUpload.field === "fotoPerfil"
                      }
                      className="absolute inset-0 rounded-2xl bg-black/45 flex items-center justify-center
                                 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    >
                      {imageUpload.state === "uploading" &&
                      imageUpload.field === "fotoPerfil" ? (
                        <Loader2
                          size={18}
                          className="text-white animate-spin"
                        />
                      ) : (
                        <Camera size={18} className="text-white" />
                      )}
                    </button>
                    <input
                      ref={profilePhotoRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect("fotoPerfil")}
                    />
                  </>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-2 sm:pt-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">
                      {restaurante?.nombre ?? "Sin nombre"}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#EAF3EE] text-[#1B6B3A] border border-[#1B6B3A] transition-all duration-200">
                        <Tag size={10} />
                        {categoria ?? EnumCategoriaRestaurante.Otros}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors ${
                          restaurante?.abierto
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            restaurante?.abierto
                              ? "bg-emerald-500"
                              : "bg-red-400"
                          }`}
                        />
                        {restaurante?.abierto ? "Abierto" : "Cerrado"}
                      </span>

                      {restaurante?.calificacionProm != null && (
                        <StarRating value={restaurante.calificacionProm} />
                      )}
                    </div>

                    {(restaurante?.horaApertura || restaurante?.horaCierre) && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                        <Clock size={11} />
                        <span>
                          {formatTime(restaurante.horaApertura)} –{" "}
                          {formatTime(restaurante.horaCierre)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex gap-2">
                    {!isEditing ? (
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#1B6B3A] hover:bg-[#145530] text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                      >
                        <Edit2 size={14} />
                        Editar perfil
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="flex items-center gap-1 px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                          <X size={14} />
                          Cancelar
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex items-center gap-1 px-3.5 py-2 bg-[#1B6B3A] hover:bg-[#145530] text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-75 disabled:cursor-wait"
                        >
                          {isSaving ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Save size={14} />
                          )}
                          {isSaving ? "Guardando..." : "Guardar"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 mb-4" />

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Descripción
              </p>
              {!isEditing ? (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {restaurante?.descripcion || (
                    <span className="italic text-slate-400">
                      Sin descripción
                    </span>
                  )}
                </p>
              ) : (
                <textarea
                  value={restauranteEdit?.descripcion ?? ""}
                  onChange={(e) =>
                    setRestauranteEdit((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  placeholder="Contá a tus clientes sobre tu restaurante..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 resize-none bg-white focus:outline-none focus:ring-[3px] focus:ring-[#1B6B3A]/25 transition-shadow leading-relaxed"
                />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
            Contacto y entrega
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoField
              icon={<Mail size={14} />}
              label="Email"
              value={restaurante?.email ?? ""}
              locked
              placeholder="Sin email"
            />

            <InfoField
              icon={<Phone size={14} />}
              label="Teléfono"
              value={
                isEditing
                  ? restauranteEdit?.telefono
                  : (restaurante?.telefono ?? "")
              }
              isEditing={isEditing}
              onChange={(v) =>
                setRestauranteEdit((prev) => ({ ...prev, telefono: v }))
              }
              placeholder="+598 2 000 0000"
              inputType="tel"
            />

            <InfoField
              icon={<MapPin size={14} />}
              label="Dirección"
              value={formatAddressLine(restaurante?.direccion)}
              locked
            />

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                  <Tag size={14} />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Categoría
                </span>
              </div>
              {!isEditing ? (
                <p className="text-sm text-slate-700 pl-9">
                  {restaurante?.categoria ?? EnumCategoriaRestaurante.Otros}
                </p>
              ) : (
                <div className="pl-9 relative">
                  <select
                    value={
                      restauranteEdit?.categoria ??
                      EnumCategoriaRestaurante.Otros
                    }
                    onChange={(e) =>
                      setRestauranteEdit((prev) => ({
                        ...prev,
                        categoria: e.target.value as EnumCategoriaRestaurante,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white appearance-none focus:outline-none focus:ring-[3px] focus:ring-[#1B6B3A]/25 cursor-pointer pr-8 transition-shadow"
                  >
                    {CATEGORIAS_RESTAURANTE.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2 4l4 4 4-4"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                  <Clock size={14} />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Horario
                </span>
              </div>

              {!isEditing ? (
                <p className="text-sm text-slate-700 pl-9">
                  {restaurante?.horaApertura || restaurante?.horaCierre ? (
                    `${formatTime(restaurante?.horaApertura)} – ${formatTime(restaurante?.horaCierre)}`
                  ) : (
                    <span className="italic text-slate-400">Sin horario</span>
                  )}
                </p>
              ) : (
                <div className="pl-9 flex items-end gap-3">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-medium text-slate-400 mb-1">
                      Apertura
                    </label>
                    <input
                      type="time"
                      value={formatTime(restauranteEdit?.horaApertura)}
                      onChange={(e) =>
                        setRestauranteEdit((prev) => ({
                          ...prev,
                          horaApertura: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-[3px] focus:ring-[#1B6B3A]/25 transition-shadow"
                    />
                  </div>
                  <span className="text-slate-300 pb-2">–</span>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-medium text-slate-400 mb-1">
                      Cierre
                    </label>
                    <input
                      type="time"
                      value={formatTime(restauranteEdit?.horaCierre)}
                      onChange={(e) =>
                        setRestauranteEdit((prev) => ({
                          ...prev,
                          horaCierre: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-[3px] focus:ring-[#1B6B3A]/25 transition-shadow"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                  <Truck size={14} />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Radio de entrega
                </span>
              </div>

              {!isEditing ? (
                <div className="pl-9 flex items-center gap-3">
                  <div className="flex-1 max-w-xs h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1B6B3A] transition-all"
                      style={{
                        width: `${((restaurante?.radioEntrega ?? 0) / SLIDER_MAX) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[#1B6B3A]">
                    {restaurante?.radioEntrega ?? 0} km
                  </span>
                </div>
              ) : (
                <div className="pl-9">
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={SLIDER_MIN}
                      max={SLIDER_MAX}
                      step={1}
                      value={restauranteEdit?.radioEntrega ?? 5}
                      onChange={(e) =>
                        setRestauranteEdit((prev) => ({
                          ...prev,
                          radioEntrega: Number(e.target.value),
                        }))
                      }
                      className="flex-1 max-w-xs appearance-none h-1.25 rounded-full outline-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1B6B3A]
                        [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white
                        [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(27,107,58,0.35),0_2px_4px_rgba(0,0,0,0.15)]
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
                        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#1B6B3A]
                        [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white
                        [&::-moz-range-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #1B6B3A 0%, #1B6B3A ${sliderPct}%, #DCFCE7 ${sliderPct}%, #DCFCE7 100%)`,
                      }}
                    />
                    <span className="text-sm font-bold text-[#1B6B3A] w-14 text-right">
                      {restauranteEdit?.radioEntrega ?? 5} km
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {SLIDER_MIN} km mínimo · {SLIDER_MAX} km máximo
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { TextInput } from "../../../components/TextInput.js";
import type { ImageField } from "../../../components/typos/ImageField.js";
import ImageUploadField from "../../../components/ImagenUploadField.js";
import type { DTORestaurante } from "../../../data/DTORestaurante.js";

import DireccionAutocomplete from "../../../components/DireccionAutocomplete.js";
import type { DireccionGeoapify } from "../../../data/DireccionGeoapify.js";
import type { DTODireccion } from "../../../data/DTODireccion.js";
import {
  enviarSolicitudAltaRestaurante,
  obtenerActual,
  obtenerFirmaCloudinary,
} from "../../../api/apiRestaurante.js";

// ── Types ──────────────────────────────────────────────────────────────────

interface FormData {
  nombre: string;
  rut: string;
  telefono: string;
  descripcion: string;
  direccion: string;
  numeroP: string;
  esquina: string;
}

type SubmitStep = "CHECKING" | "FORM" | "LOADING" | "SUCCESS" | "EN_PROCESO";

// ── Validators ─────────────────────────────────────────────────────────────
function validateRUT(rut: string): boolean {
  // Uruguayan RUT: 12 digits
  return /^\d{12}$/.test(rut.replace(/[-.\s]/g, ""));
}

function validateTelefono(tel: string): boolean {
  const digits = tel.replace(/\D/g, "");
  return digits.length >= 11 && digits.startsWith("598");
}

function validarImagen(
  imageField: ImageField,
  etiqueta: string,
): string | undefined {
  if (!imageField.file && !imageField.previewUrl) {
    return `La ${etiqueta} es requerida`;
  }
  if (imageField.uploadState === "uploading") {
    return `La ${etiqueta} se está subiendo. Esperá un momento`;
  }
  if (imageField.uploadState === "done" && imageField.cloudUrl) {
    return undefined;
  }
  return `No se pudo subir la ${etiqueta}. Volvé a seleccionarla`;
}

export default function SolicitarAltaRestaurante() {
  const navigate = useNavigate();
  const [step, setStep] = useState<SubmitStep>("CHECKING");

  // Al montar, verificamos el estado real del restaurante. Si ya envió una
  // solicitud de alta (tiene datos cargados) pero todavía no está habilitado,
  // mostramos la pantalla "en proceso" en vez del formulario vacío.
  useEffect(() => {
    let cancelado = false;

    obtenerActual()
      .then((resto) => {
        if (cancelado) return;

        if (resto.habilitado) {
          // Ya fue aprobado: lo mandamos a trabajar.
          localStorage.setItem("restauranteHabilitado", "true");
          navigate("/restaurantes/ListarPedidosSinConfirmar", {
            replace: true,
          });
          return;
        }

        // Consideramos que la solicitud ya fue enviada si el restaurante tiene
        // datos que sólo se cargan en el alta (RUT / descripción / dirección).
        const solicitudEnviada = Boolean(
          resto.rut?.trim() ||
            resto.descripcion?.trim() ||
            resto.direccion?.calle?.trim(),
        );

        setStep(solicitudEnviada ? "EN_PROCESO" : "FORM");
      })
      .catch(() => {
        // Ante un error de red no bloqueamos el alta: mostramos el formulario.
        if (!cancelado) setStep("FORM");
      });

    return () => {
      cancelado = true;
    };
  }, [navigate]);

  const [form, setForm] = useState<FormData>({
    nombre: "",
    rut: "",
    telefono: "",
    descripcion: "",
    direccion: "",
    numeroP: "",
    esquina: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof FormData, string | undefined>>
  >({});

  const [direccionSeleccionada, setDireccionSeleccionada] =
    useState<DireccionGeoapify | null>(null);

  const [esquinaSeleccionada, setEsquinaSeleccionada] =
    useState<DireccionGeoapify | null>(null);

  const [imagePerfil, setImagePerfil] = useState<ImageField>({
    file: null,
    previewUrl: null,
    uploadState: "idle",
    cloudUrl: null,
  });
  const [imagePortada, setImagePortada] = useState<ImageField>({
    file: null,
    previewUrl: null,
    uploadState: "idle",
    cloudUrl: null,
  });
  const [imageErrors, setImageErrors] = useState<{
    perfil?: string;
    portada?: string;
  }>({});

  const [apiError, setApiError] = useState<string | null>(null);

  const handleImageChange = async (field: "perfil" | "portada", file: File) => {
    const estadoAnterior = field === "perfil" ? imagePerfil : imagePortada;
    if (estadoAnterior.previewUrl) {
      // Liberamos la memoria de la imagen anterior antes de pisarla
      URL.revokeObjectURL(estadoAnterior.previewUrl);
    }

    //CREAR LA NUEVA URL
    const previewUrl = URL.createObjectURL(file);
    const setter = field === "perfil" ? setImagePerfil : setImagePortada;

    setter({ file, previewUrl, uploadState: "uploading", cloudUrl: null });
    setImageErrors((p) => ({ ...p, [field]: undefined }));

    try {
      const nombreSinExtension =
        file.name.substring(0, file.name.lastIndexOf(".")) || file.name;

      //Llamamos a tu función externa
      const datosBack = await obtenerFirmaCloudinary(
        nombreSinExtension,
        "image",
      );

      //Cargamos el FormData con los nombres exactos que pide Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", datosBack.apiKey);
      formData.append("timestamp", datosBack.timestamp.toString());
      formData.append("signature", datosBack.firma); // 'firma' mapea a 'signature'
      formData.append("public_id", datosBack.publicId); // 'publicId' mapea a 'public_id'

      const cloudinaryRes = await fetch(datosBack.uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!cloudinaryRes.ok) throw new Error("Cloudinary rechazó la imagen");

      const cloudinaryData = await cloudinaryRes.json();

      const urlOriginal = cloudinaryData.secure_url;

      //Guardamos la URL segura final en tu estado
      setter((prev) => ({
        ...prev,
        uploadState: "done",
        cloudUrl: urlOriginal, // Usamos la optimizada
      }));
    } catch (error) {
      console.error("Error en el proceso de imagen:", error);
      setter({ file, previewUrl, uploadState: "idle", cloudUrl: null });
      setImageErrors((p) => ({
        ...p,
        [field]: `No se pudo subir la imagen de ${field === "perfil" ? "perfil" : "portada"}. Intentá de nuevo`,
      }));
    }
  };

  // ── Field change ──────────────────────────────────────────────────────────
  const set = (key: keyof FormData) => (v: string) => {
    setForm((p) => ({ ...p, [key]: v }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!form.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    } else if (form.nombre.trim().length < 3) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres";
    }

    if (!form.rut.trim()) {
      newErrors.rut = "El RUT es requerido";
    } else if (!validateRUT(form.rut)) {
      newErrors.rut = "El RUT debe tener 12 dígitos";
    }

    if (!form.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    } else if (!validateTelefono(form.telefono)) {
      newErrors.telefono = "Ingresá un número uruguayo válido (+598 XXXXXXXX)";
    }

    if (!form.descripcion.trim()) {
      newErrors.descripcion = "La descripción es requerida";
    } else if (form.descripcion.trim().length < 20) {
      newErrors.descripcion =
        "La descripción debe tener al menos 20 caracteres";
    }

    if (!direccionSeleccionada) {
      newErrors.direccion = "Seleccioná una dirección de la lista";
    }

    if (!form.numeroP.trim()) {
      newErrors.numeroP = "El número de puerta es requerido";
    }

    const imgErrors: { perfil?: string; portada?: string } = {};
    const perfilError = validarImagen(imagePerfil, "imagen de perfil");
    const portadaError = validarImagen(imagePortada, "imagen de portada");
    if (perfilError) imgErrors.perfil = perfilError;
    if (portadaError) imgErrors.portada = portadaError;

    setErrors(newErrors);
    setImageErrors(imgErrors);

    return Object.keys(newErrors).length === 0 && !perfilError && !portadaError;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setApiError(null);
    if (!validate()) return;

    setStep("LOADING");

    try {
      const dir: DTODireccion = {
        tag: "",
        calle: direccionSeleccionada!.calle,
        numero: form.numeroP.trim(),
        apartamento: "",
        esquina: esquinaSeleccionada?.calle || form.esquina.trim(),
        latitud: direccionSeleccionada!.latitud,
        longitud: direccionSeleccionada!.longitud,
      };
      const resto: DTORestaurante = {
        nombre: form.nombre,
        rut: form.rut,
        telefono: form.telefono,
        descripcion: form.descripcion,
        direccion: dir,
      };

      if (imagePerfil.cloudUrl) {
        resto.fotoPerfil = imagePerfil.cloudUrl;
      }

      if (imagePortada.cloudUrl) {
        resto.fotoPortada = imagePortada.cloudUrl;
      }

      const response = await enviarSolicitudAltaRestaurante(resto);
      setStep("SUCCESS");
    } catch (error) {
      console.error("Error al enviar solicitud:", error);

      setApiError(
        "Ocurrió un error al enviar la solicitud. Intentá nuevamente.",
      );
      setStep("FORM");
    }
  };

  // ------Cancelar-------
  const handleCancel = () => {
    if (imagePerfil.previewUrl) URL.revokeObjectURL(imagePerfil.previewUrl);
    if (imagePortada.previewUrl) URL.revokeObjectURL(imagePortada.previewUrl);
    setForm({
      nombre: "",
      rut: "",
      telefono: "",
      descripcion: "",
      direccion: "",
      numeroP: "",
      esquina: "",
    });
    setErrors({});
    setImagePerfil({
      file: null,
      previewUrl: null,
      uploadState: "idle",
      cloudUrl: null,
    });
    setImagePortada({
      file: null,
      previewUrl: null,
      uploadState: "idle",
      cloudUrl: null,
    });
    setImageErrors({});
    setApiError(null);
  };

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-6 w-full">
        <div className="w-full max-w-6xl">
          <h1 className="text-3xl font-bold text-trego-restaurante text-center mb-4 tracking-tight">
            Alta Restaurante
          </h1>

          {/* ── CHECKING (verificando estado) ── */}
          {step === "CHECKING" && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-trego-restaurante animate-spin" />
              <p className="text-sm text-gray-400">Cargando...</p>
            </div>
          )}

          {/* ── EN_PROCESO (solicitud ya enviada) ── */}
          {step === "EN_PROCESO" && (
            <div className="flex flex-col items-center gap-6 py-16">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Solicitud en proceso
              </h2>
              <p className="text-gray-500 text-center max-w-sm">
                Ya recibimos tu solicitud de alta y está en revisión. Te
                avisaremos por correo cuando el proceso de verificación haya
                finalizado.
              </p>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === "SUCCESS" && (
            <div className="flex flex-col items-center gap-6 py-16">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-trego-restaurante"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                ¡Solicitud enviada!
              </h2>
              <p className="text-gray-500 text-center max-w-sm">
                Nos comunicaremos a la brevedad. Recibirás un correo con
                información sobre el proceso de verificación.
              </p>
            </div>
          )}

          {/* ── LOADING ── */}
          {step === "LOADING" && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-trego-restaurante animate-spin" />
              <p className="text-sm text-gray-400">Enviando solicitud...</p>
            </div>
          )}

          {/* ── FORM ── */}
          {step === "FORM" && (
            <div className="bg-white w-full rounded-3xl shadow-lg  shadow-green-50 p-8 flex flex-col gap-8 justify-center">
              {/* API Error */}
              {apiError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  <span>{apiError}</span>
                </div>
              )}

              {/* Row 1: Images + descripcion */}
              <div className="flex flex-row md:flex-row gap-4">
                <div className="flex flex-col gap-15">
                  {/* Images */}
                  <div className="flex flex-row md:flex-row gap-20 shrink-0">
                    <ImageUploadField
                      label="Imagen de Perfil"
                      imageField={imagePerfil}
                      onImageChange={(f) => handleImageChange("perfil", f)}
                      hasError={!!imageErrors.perfil}
                      {...(imageErrors.perfil
                        ? { errorMessage: imageErrors.perfil }
                        : {})}
                    />
                    <ImageUploadField
                      label="Imagen de Portada"
                      imageField={imagePortada}
                      onImageChange={(f) => handleImageChange("portada", f)}
                      hasError={!!imageErrors.portada}
                      {...(imageErrors.portada
                        ? { errorMessage: imageErrors.portada }
                        : {})}
                    />
                  </div>

                  {/* Descripcion */}
                  <div className="w-120 max-w-full -mt-5 mx-auto">
                    <h1 className="text-sm font-semibold px-5">Descripción</h1>
                    <textarea
                      value={form.descripcion}
                      onChange={(e) => set("descripcion")(e.target.value)}
                      placeholder="Describe tu restaurante, productos y público objetivo..."
                      rows={4}
                      className="peer w-full border border-gray-400 rounded-3xl p-5 outline-none
                     focus:border-trego-restaurante focus:ring-1 focus:ring-trego-restaurante"
                    />
                    {errors.descripcion && (
                      <p className="text-red-500 text-xs px-5 mt-1">
                        {errors.descripcion}
                      </p>
                    )}
                  </div>
                </div>

                {/* Nombre + Razon Social + RUT + tel + dir*/}
                <div className="flex-1 flex w-full justify-center">
                  <div className="flex w-110 flex-col gap-5">
                    <div>
                      <h1 className="text-sm font-semibold px-5">Nombre</h1>
                      <TextInput
                        value={form.nombre}
                        onChange={set("nombre")}
                        placeholder="El Restaurante"
                        colorStyle="trego-restaurante"
                        label={false}
                        error={errors.nombre ?? ""}
                      />
                    </div>

                    <div>
                      <h1 className="text-sm font-semibold px-5">RUT</h1>
                      <TextInput
                        value={form.rut}
                        onChange={set("rut")}
                        placeholder="XXXXXXXXXXXX"
                        colorStyle="trego-restaurante"
                        label={false}
                        error={errors.rut ?? ""}
                      />
                    </div>
                    <div>
                      <h1 className="text-sm font-semibold px-5">
                        Numero de telefono
                      </h1>
                      <TextInput
                        value={form.telefono}
                        onChange={set("telefono")}
                        placeholder="+598 99 000 000"
                        colorStyle="trego-restaurante"
                        label={false}
                        error={errors.telefono ?? ""}
                      />
                    </div>
                    <div className="flex flex-col gap-5">
                      <DireccionAutocomplete
                        label="Dirección"
                        value={form.direccion}
                        error={errors.direccion ?? ""}
                        onChangeText={(texto) => {
                          setForm((prev) => ({ ...prev, direccion: texto }));
                          setDireccionSeleccionada(null);
                          setErrors((prev) => ({
                            ...prev,
                            direccion: undefined,
                          }));
                        }}
                        onClear={() => setDireccionSeleccionada(null)}
                        onSelectAddress={(dirCompletada) => {
                          setDireccionSeleccionada(dirCompletada);
                          setForm((prev) => ({
                            ...prev,
                            direccion: [
                              dirCompletada.calle,
                              dirCompletada.numero,
                            ]
                              .filter(Boolean)
                              .join(" "),
                            numeroP: dirCompletada.numero
                              ? String(dirCompletada.numero)
                              : prev.numeroP,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            direccion: undefined,
                          }));
                        }}
                      />
                      <div className="flex gap-5">
                        <div>
                          <h1 className="text-sm font-semibold px-5">
                            N. Puerta
                          </h1>
                          <TextInput
                            value={form.numeroP}
                            onChange={set("numeroP")}
                            placeholder="N. Puerta"
                            colorStyle="trego-restaurante"
                            label={false}
                            error={errors.numeroP ?? ""}
                          />
                        </div>
                        <DireccionAutocomplete
                          label="Esquina"
                          value={form.esquina}
                          onChangeText={(texto) => {
                            setForm((prev) => ({ ...prev, esquina: texto }));
                            setEsquinaSeleccionada(null);
                          }}
                          onClear={() => setEsquinaSeleccionada(null)}
                          onSelectAddress={(dirCompletada) => {
                            setEsquinaSeleccionada(dirCompletada);
                            setForm((prev) => ({
                              ...prev,
                              esquina:
                                dirCompletada.calle ||
                                dirCompletada.direccionCompleta,
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-10 px-10 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={
                    imagePerfil.uploadState === "uploading" ||
                    imagePortada.uploadState === "uploading"
                  }
                  className="
                      flex-1 py-3.5 px-6 rounded-3xl
                      bg-trego-restaurante hover:bg-green-700
                      text-white text-base font-bold
                      transition-all duration-200
                      shadow-md hover:shadow-green-200
                    "
                >
                  Confirmar Solicitud
                </button>
                <button
                  onClick={handleCancel}
                  className="
                      flex-1 py-3.5 px-6 rounded-3xl
                      bg-gray-100 hover:bg-gray-200
                      text-gray-600 text-base font-semibold
                      transition-all duration-200
                    "
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

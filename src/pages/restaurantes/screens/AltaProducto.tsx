import { useEffect, useState } from "react";
import type { DTOIngrediente } from "../../../data/DTOIngrediente.js";
import type { ImageField } from "../../../components/typos/ImageField.js";
import type { DTOProducto } from "../../../data/DTOProducto.js";
import { TextSelector } from "../../../components/TextSelector.js";
import AltaPlato from "../componentes/AltaPlato.js";
import AltaArticulo from "../componentes/AltaArticulo.js";
import AltaCombo from "../componentes/AltaCombo.js";
import {
  agregarProducto,
  listarSubcategorias,
  obtenerFirmaCloudinary,
} from "../../../api/apiRestaurante.js";
import type { DTOSubcategoria } from "../../../data/DTOSubcategoria.js";
import { EnumCategoriaProducto } from "../../../data/EnumCategoriaProducto.js";
import { EnumTipoProducto } from "../../../data/EnumTipoProducto.js";
import { useSubCategorias } from "../../../hooks/useSubCategorias.js";

// ─── Tipos ─────────────────────────────────────────────────────
export interface TipoProducto {
  id: number;
  label: EnumTipoProducto;
}

export const TIPOS_PRODUCTO: TipoProducto[] = [
  { id: 1, label: EnumTipoProducto.Plato },
  { id: 2, label: EnumTipoProducto.Articulo },
  { id: 3, label: EnumTipoProducto.Combo },
];

type StepState = "FORM" | "LOADING" | "SUCCESS";

// ─── Componente principal ──────────────────────────────────────
export default function AltaProducto() {
  const [step, setStep] = useState<StepState>("FORM");
  const [tipo, setTipo] = useState<TipoProducto | undefined>(TIPOS_PRODUCTO[0]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Estados compartidos
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState(0);
  const [foto, setFoto] = useState<ImageField>({
    file: null,
    previewUrl: null,
    cloudUrl: null,
    uploadState: "idle",
  });
  const [descripcion, setDescripcion] = useState("");
  const {
    subcategoriasFiltradas,
    categoriaFiltro,
    setCategoriaFiltro,
    subcategoriaSeleccionada,
    seleccionarSubcategoria,
  } = useSubCategorias({ onError: (msg) => setApiError("Error: " + msg) });

  // Estados para Plato (con ingredientes)
  const [tiempoPreparacion, setTiempoPreparacion] = useState(0);

  const [listaIngredientes, setListaIngredientes] = useState<DTOIngrediente[]>(
    [],
  );
  // Estados para Combo
  const [productosCombo, setProductosCombo] = useState<DTOProducto[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Manejador de imagen
  const handleImageChange = (file: File | null) => {
    if (!file) {
      // Opcional: resetear la imagen si se elimina
      // setFoto({ file: null, previewUrl: null, cloudUrl: null, uploadState: "idle" });
      return;
    }

    // Liberar URL anterior
    if (foto.previewUrl) {
      URL.revokeObjectURL(foto.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setFoto({ file, previewUrl, uploadState: "uploading", cloudUrl: null });

    subirImagen(file, previewUrl);
  };

  async function subirImagen(file: File, previewUrl: string) {
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

      const urlOriginal = cloudinaryData.secure_url;

      setFoto((prev) => ({
        ...prev,
        uploadState: "done",
        cloudUrl: urlOriginal, // Usamos la optimizada
      }));
    } catch (error) {
      console.error("Error en el proceso de imagen:", error);
      setFoto({ file, previewUrl, uploadState: "idle", cloudUrl: null });
      setErrors((p) => ({ ...p, foto: "Error al subir la imagen" }));
    }
  }
  // Validación
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!nombre.trim()) errs.nombre = "El nombre es obligatorio.";
    if (precio < 0 || isNaN(precio)) errs.precio = "Ingrese un precio válido.";
    if (!foto.file) errs.foto = "La imagen es obligatoria.";

    if (tipo?.id === 1) {
      // Plato con ingredientes
      if (!tiempoPreparacion || tiempoPreparacion < 0)
        errs.tiempoPreparacion = "Ingrese un tiempo válido.";
    }
    if (tipo?.id === 3 && productosCombo.length === 0) {
      errs.combo = "Seleccione al menos un producto para el combo.";
    }
    if (!tipo) {
      errs.tipo = "No se selecciono el tipo de Producto";
    }
    if (!foto.cloudUrl) {
      errs.foto = "Foto no cargada correctamente!.";
    }
    if (!subcategoriaSeleccionada?.idSubCategoria) {
      errs.subcategoria = "Sin sub-categoria seleccionada!.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const changeTipo = (x: TipoProducto | undefined) => {
    setTipo(x);
    setApiError("");
  };

  const handleSubmit = async () => {
    setApiError(null);
    if (!validate()) return;
    setStep("LOADING");
    try {
      const subca: DTOSubcategoria = {
        categoria: EnumCategoriaProducto.Bebida,
      };

      const data: DTOProducto = {
        nombre: nombre,
        descripcion: descripcion,
        precio: precio,
        subCategoria: subca,
        urlImagen: foto.cloudUrl ?? "",
        categoria: categoriaFiltro ?? EnumCategoriaProducto.Bebida,
        idSubCategoria: subcategoriaSeleccionada?.idSubCategoria ?? 0,
        tipo: tipo?.label ?? EnumTipoProducto.Articulo,
      };

      switch (tipo?.label) {
        case EnumTipoProducto.Plato:
          ((data.ingredientes = listaIngredientes),
            (data.plato = {
              tiempoPreparacionMinutos: tiempoPreparacion,
            }));
          break;
        case EnumTipoProducto.Combo:
          data.combo = {
            productosIncluidos: productosCombo.map((p) => ({
              id: p.idProducto ?? 0,
              nombre: p.nombre ?? "",
            })),
          };
          break;
      }
      await agregarProducto(data);

      setStep("SUCCESS");
    } catch {
      setApiError("Error al guardar el producto.");
      setStep("FORM");
    }
  };

  const resetForm = () => {
    setNombre("");
    setPrecio(0);
    setDescripcion("");
    seleccionarSubcategoria(undefined);
    setTiempoPreparacion(0);
    setListaIngredientes([]);
    setProductosCombo([]);
    setFoto({
      file: null,
      previewUrl: null,
      cloudUrl: null,
      uploadState: "idle",
    });
    setErrors({});
    setApiError(null);
  };

  const handleCancel = () => {
    resetForm();
    setTipo(TIPOS_PRODUCTO[0]); // vuelve al primer tipo
    setStep("FORM");
  };

  const onChangeCategoria = (categoria: EnumCategoriaProducto | undefined) => {
    if (!categoria) return;
    setCategoriaFiltro(categoria);
  };

  return (
    <>
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 md:px-10 py-6 sm:py-8 bg-gray-50">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          Alta Producto
        </h1>

        {/* SUCCESS */}
        {step === "SUCCESS" && (
          <div className="flex flex-col items-center gap-6 py-20">
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
              ¡Producto agregado!
            </h2>
            <p className="text-gray-500 text-center max-w-sm">
              El producto ya está disponible en tu menú.
            </p>
            <button
              onClick={() => {
                resetForm();
                setStep("FORM");
              }}
              className="mt-2 px-8 py-3 rounded-3xl bg-trego-restaurante text-white font-bold hover:bg-green-700 transition-colors"
            >
              Agregar otro producto
            </button>
          </div>
        )}

        {/* LOADING */}
        {step === "LOADING" && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-trego-restaurante animate-spin" />
            <p className="text-sm text-gray-400">Guardando producto...</p>
          </div>
        )}

        {/* FORM */}
        {step === "FORM" && (
          <div className="bg-white rounded-3xl shadow-lg shadow-green-50 p-8 flex flex-col gap-1">
            {/* Selector de tipo */}
            <div className="w-full max-w-md m-auto">
              <TextSelector
                items={TIPOS_PRODUCTO}
                selected={tipo}
                onSelect={(x) => changeTipo(x)}
                placeholder="Tipo de producto"
                mapToItem={(t) => ({ id: t.id, label: t.label })}
              />
            </div>

            {/* Renderizado condicional según tipo.id */}
            {tipo?.id === 1 && (
              <AltaPlato
                nombre={nombre}
                descripcion={descripcion}
                precio={precio}
                subcategoria={subcategoriaSeleccionada}
                tiempoPreparacion={tiempoPreparacion}
                foto={foto}
                onChangeNombre={setNombre}
                onChangeDescripcion={setDescripcion}
                onChangePrecio={setPrecio}
                onChangeSubCategoria={seleccionarSubcategoria}
                onChangeTiempoPrep={setTiempoPreparacion}
                onChangeImage={handleImageChange}
                onChangeListaDeIngredientes={setListaIngredientes}
                error={errors}
                onChangeApiError={setApiError}
                categoria={categoriaFiltro}
                onChangeCategoria={onChangeCategoria}
                subcategorias={subcategoriasFiltradas}
              />
            )}

            {tipo?.id === 2 && (
              <AltaArticulo
                nombre={nombre}
                descripcion={descripcion}
                precio={precio}
                subcategorias={subcategoriasFiltradas}
                subcategoria={subcategoriaSeleccionada}
                foto={foto}
                onChangeNombre={setNombre}
                onChangeDescripcion={setDescripcion}
                onChangePrecio={setPrecio}
                onChangeSubCategoria={seleccionarSubcategoria}
                onChangeImage={handleImageChange}
                error={errors}
                categoria={categoriaFiltro}
                onChangeCategoria={onChangeCategoria}
              />
            )}

            {tipo?.id === 3 && (
              <AltaCombo
                nombre={nombre}
                descripcion={descripcion}
                precio={precio}
                subcategoria={subcategoriaSeleccionada}
                foto={foto}
                onChangeNombre={setNombre}
                onChangeDescripcion={setDescripcion}
                onChangePrecio={setPrecio}
                onChangeSubCategoria={seleccionarSubcategoria}
                onChangeImage={handleImageChange}
                productosSeleccionados={productosCombo}
                onChangeListaProd={setProductosCombo}
                error={errors}
                onChangeApiError={setApiError}
                categoria={categoriaFiltro}
                onChangeCategoria={onChangeCategoria}
                subcategorias={subcategoriasFiltradas}
              />
            )}

            {/* API Error */}
            {apiError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                <span>⚠</span> {apiError}
              </div>
            )}

            {/* Errores de validación generales */}
            {Object.keys(errors).length > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                ⚠ Faltan campos por completar. Revisá los campos marcados en
                rojo.
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={handleSubmit}
                className="flex-1 py-3.5 px-6 rounded-3xl bg-trego-restaurante hover:bg-green-700 text-white text-base font-bold transition-all duration-200 shadow-md"
              >
                Confirmar Producto
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-3.5 px-6 rounded-3xl border border-trego-orange text-trego-orange hover:bg-trego-orange hover:text-white  text-base font-semibold transition-all duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

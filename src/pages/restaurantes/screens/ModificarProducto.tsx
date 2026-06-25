import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ImageField } from "../../../components/typos/ImageField.js";
import { EnumCategoriaProducto } from "../../../data/EnumCategoriaProducto.js";
import type { DTOProducto } from "../../../data/DTOProducto.js";
import { EnumTipoProducto } from "../../../data/EnumTipoProducto.js";
import AltaPlato from "../componentes/AltaPlato.js";
import AltaArticulo from "../componentes/AltaArticulo.js";
import AltaCombo from "../componentes/AltaCombo.js";
import ConfirmarEliminarProductoModal from "../componentes/ConfirmarEliminarProductoModal.js";
import type { DTOIngrediente } from "../../../data/DTOIngrediente.js";
import { useProductoRestaurante } from "../../../hooks/useProductoRestaurante.js";
import {
  deshabilitarProducto,
  habilitarProducto,
  modificarProducto,
  obtenerFirmaCloudinary,
} from "../../../api/apiRestaurante.js";
import AltaOferta from "./AltaOferta.js";
import { useSubCategorias } from "../../../hooks/useSubCategorias.js";
import { ChevronLeft, Tag } from "lucide-react";

type StepState = "FORM" | "LOADING" | "SUCCESS";

// ─── Componente principal ──────────────────────────────────────
interface ModificarProductoProps {
  producto: DTOProducto;
  onReturn: () => void;
  deshabilitado?: boolean;
}

export default function ModificarProducto({
  producto,
  onReturn,
  deshabilitado,
}: ModificarProductoProps) {
  const [step, setStep] = useState<StepState>("FORM");
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const {
    subcategoriasFiltradas,
    categoriaFiltro,
    setCategoriaFiltro,
    subcategoriaSeleccionada,
    seleccionarSubcategoria,
  } = useSubCategorias({ onError: (msg) => setApiError("Error: " + msg) });
  const { productos } = useProductoRestaurante();
  const [ofertaNueva, setNuevaOferta] = useState<boolean>(false);
  // Nombre del producto a modificar
  const [nombre, setNombre] = useState(producto.nombre ?? "");
  // Precio del producto a modificar
  const [precio, setPrecio] = useState<number>(producto.precio ?? 0);
  // Foto del producto a modificar
  const [foto, setFoto] = useState<ImageField>({
    file: null,
    previewUrl: producto.urlImagen || null,
    cloudUrl: producto.urlImagen,
    uploadState: "idle",
  });
  // Descripcion del producto a modificar
  const [descripcion, setDescripcion] = useState(producto.descripcion ?? "");

  // Estados para Plato (con ingredientes)
  // Tiempo de preparacion del Plato
  const [tiempoPreparacion, setTiempoPreparacion] = useState(
    producto.plato?.tiempoPreparacionMinutos,
  );
  // Lista de ingredientes que contiene el Plato
  const [listaIngredientes, setListaIngredientes] = useState<DTOIngrediente[]>(
    producto.ingredientes ?? [],
  );
  const listaIngredientesRef = useRef<DTOIngrediente[]>(
    producto.ingredientes ?? [],
  );

  const handleListaIngredientesChange = useCallback(
    (lista: DTOIngrediente[]) => {
      listaIngredientesRef.current = lista;
      setListaIngredientes(lista);
    },
    [],
  );

  const handleCategoriaChange = (
    nuevaCategoria: EnumCategoriaProducto | undefined,
  ) => {
    setCategoriaFiltro(nuevaCategoria);
    // Si la subcategoría actual no pertenece a la nueva categoría, resetearla
    if (
      subcategoriaSeleccionada &&
      nuevaCategoria !== subcategoriaSeleccionada.categoria
    ) {
      seleccionarSubcategoria(undefined);
    }
  };

  useEffect(() => {
    setCategoriaFiltro(producto.categoria);
    seleccionarSubcategoria(producto.subCategoria);
  }, []);
  // Estados para Combo
  // Productos que conforman el Combo a modificar -- Viene como lista de numeros
  const [idProductosCombo, setIdProductosCombo] = useState<number[]>(
    producto.combo?.productosIncluidos?.map((p) => p.id) ?? [],
  );
  // Productos completos pertenecientes al combo
  const productosDelCombo = useMemo(() => {
    if (!productos || idProductosCombo.length === 0) return [];
    return idProductosCombo
      .map((id) => productos.find((p) => p.idProducto === id))
      .filter((p): p is DTOProducto => p != null);
  }, [productos, idProductosCombo]);

  // Lista completa de Productos que utiliza el combo
  const handleChangeListaProd = (nuevosProductos: DTOProducto[]) => {
    const nuevosIds = nuevosProductos
      .map((p) => p.idProducto)
      .filter((id): id is number => id != null); // descartamos undefined/null
    setIdProductosCombo(nuevosIds);
  };

  useEffect(() => {
    setFoto({
      file: null,
      previewUrl: producto.urlImagen || null,
      cloudUrl: producto.urlImagen,
      uploadState: "idle",
    });
  }, [producto.idProducto]);

  useEffect(() => {
    return () => {
      if (foto.previewUrl && foto.file) {
        URL.revokeObjectURL(foto.previewUrl);
      }
    };
  }, [foto.previewUrl]);
  /**
   * Maneja el cambio de imagen de la modificacion de producto
   * Si existe una imagen, la limpia antes de cargar la nueva, esta imagen viene desde el backend y es cargada desde setFoto
   * @param file archivo que se va a subir
   */
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

  /**
   * Obtiene la firma del backend y procede a subir la imagen a cloudinary si salio todo bien
   * @param file archivo de donde se obtendran los datos para subir la imagen a cloudinary y firmar en el backend
   * @param previewUrl Preview para mostrar la imagen subida en pantalla del usuario
   */

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

      // Recortamos la imagen para que se vea de forma mas optimizada desde android
      const urlOptimizada = urlOriginal.replace(
        "/upload/",
        "/upload/w_1200,h_1200",
      );

      setFoto((prev) => ({
        ...prev,
        uploadState: "done",
        cloudUrl: urlOptimizada, // Usamos la optimizada
      }));
    } catch (error) {
      console.error("Error en el proceso de imagen:", error);
      setFoto({ file, previewUrl, uploadState: "idle", cloudUrl: null });
      setErrors((p) => ({ ...p, foto: "Error al subir la imagen" }));
    }
  }

  /**
   * Valida los datos ingresados antes de Cargar el producto en el backend
   * @returns True si los datos obligatorios se encuentran cargados, False si faltan datos obligatorios
   */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!nombre?.trim()) errs.nombre = "El nombre es obligatorio.";
    const precioNumerico = Number(precio);
    if (isNaN(precioNumerico) || precioNumerico < 0) {
      errs.precio = "Ingrese un precio válido.";
    }
    if (!foto.cloudUrl && !foto.file) errs.foto = "La imagen es obligatoria.";

    if (producto.tipo === EnumTipoProducto.Plato) {
      // Plato con ingredientes
      if (!tiempoPreparacion || tiempoPreparacion < 0)
        errs.tiempoPreparacion = "Ingrese un tiempo válido.";
    }
    if (
      producto.tipo === EnumTipoProducto.Combo &&
      productosDelCombo.length === 0
    ) {
      errs.combo = "Seleccione al menos un producto para el combo.";
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

  const handleHabilitar = async () => {
    setApiError(null);
    if (!validate()) return;
    setStep("LOADING");
    try {
      if (!foto.cloudUrl) {
        setApiError("Foto no cargada correctamente.");
        setStep("FORM");
        return;
      }
      if (!subcategoriaSeleccionada?.idSubCategoria) {
        setApiError("Sin sub-categoría seleccionada.");
        setStep("FORM");
        return;
      }
      if (!producto.idProducto) {
        setApiError("El producto no tiene id válido.");
        setStep("FORM");
        return;
      }

      const data: DTOProducto = {
        idProducto: producto.idProducto ?? 0,
        nombre,
        descripcion,
        precio,
        urlImagen: foto.cloudUrl ?? "",
        categoria: categoriaFiltro ?? EnumCategoriaProducto.Bebida,
        idSubCategoria: subcategoriaSeleccionada.idSubCategoria,
        tipo: producto.tipo ?? EnumTipoProducto.Articulo,
      };

      switch (producto.tipo) {
        case EnumTipoProducto.Plato:
          data.ingredientes = listaIngredientesRef.current
            .filter((i) => i.idIngrediente != null)
            .map((i) => ({
              idIngrediente: i.idIngrediente!,
              nombre: i.nombre,
              idRestaurante: i.idRestaurante ?? producto.idRestaurante ?? 0,
            }));
          data.plato = {
            tiempoPreparacionMinutos: tiempoPreparacion ?? 0,
          };
          break;
        case EnumTipoProducto.Combo:
          data.combo = {
            productosIncluidos: productosDelCombo.map((p) => ({
              id: p.idProducto ?? 0,
              nombre: p.nombre ?? "",
            })),
          };
          break;
      }

      if (producto.idProducto) {
        await habilitarProducto(producto.idProducto);
        await modificarProducto(data);
        setStep("SUCCESS");
      } else {
        setApiError("No se encontro el producto que se quiere habilitar");
      }
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Error al guardar el producto.",
      );
      setStep("FORM");
    }
  };

  const handleSubmit = async () => {
    setApiError(null);
    if (!validate()) return;
    setStep("LOADING");
    try {
      if (!foto.cloudUrl) {
        setApiError("Foto no cargada correctamente.");
        setStep("FORM");
        return;
      }
      if (!subcategoriaSeleccionada?.idSubCategoria) {
        setApiError("Sin sub-categoría seleccionada.");
        setStep("FORM");
        return;
      }
      if (!producto.idProducto) {
        setApiError("El producto no tiene id válido.");
        setStep("FORM");
        return;
      }

      const data: DTOProducto = {
        idProducto: producto.idProducto,
        nombre,
        descripcion,
        precio,
        urlImagen: foto.cloudUrl,
        categoria: categoriaFiltro ?? EnumCategoriaProducto.Bebida,
        idSubCategoria: subcategoriaSeleccionada.idSubCategoria,
        tipo: producto.tipo ?? EnumTipoProducto.Articulo,
      };

      switch (producto.tipo) {
        case EnumTipoProducto.Plato:
          data.ingredientes = listaIngredientesRef.current
            .filter((i) => i.idIngrediente != null)
            .map((i) => ({
              idIngrediente: i.idIngrediente!,
              nombre: i.nombre,
              idRestaurante: i.idRestaurante ?? producto.idRestaurante ?? 0,
            }));
          data.plato = {
            tiempoPreparacionMinutos: tiempoPreparacion ?? 0,
          };
          break;
        case EnumTipoProducto.Combo:
          data.combo = {
            productosIncluidos: productosDelCombo.map((p) => ({
              id: p.idProducto ?? 0,
              nombre: p.nombre ?? "",
            })),
          };
          break;
      }

      await modificarProducto(data);
      setStep("SUCCESS");
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Error al guardar el producto.",
      );
      setStep("FORM");
    }
  };

  const handleAbrirModalEliminar = () => {
    if (!producto.idProducto) return;
    setErrorEliminar(null);
    setMostrarModalEliminar(true);
  };

  const handleCerrarModalEliminar = () => {
    if (eliminando) return;
    setMostrarModalEliminar(false);
    setErrorEliminar(null);
  };

  const handleConfirmarEliminar = async () => {
    if (!producto.idProducto) return;

    setEliminando(true);
    setErrorEliminar(null);
    try {
      await deshabilitarProducto(producto.idProducto);
      setMostrarModalEliminar(false);
      onReturn();
    } catch (err) {
      setErrorEliminar(
        err instanceof Error ? err.message : "Error al eliminar el producto.",
      );
    } finally {
      setEliminando(false);
    }
  };

  if (ofertaNueva) {
    return (
      <AltaOferta
        producto={producto}
        onCancelar={() => setNuevaOferta(false)}
      />
    );
  }

  return (
    <>
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 md:px-10 py-6 sm:py-8 bg-gray-75">
        <div className="flex items-center justify-between mb-2 py-4 border-b border-gray-100">
          <button
            type="button"
            onClick={onReturn}
            className="flex items-center gap-1.5 text-gray-500 hover:text-trego-admin font-medium transition-colors"
          >
            <ChevronLeft size={20} />
            Volver
          </button>

          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Modificar producto
            </h1>
            <span className="text-sm text-gray-500 font-medium">
              {producto.nombre}
            </span>
          </div>

          <button
            onClick={() => setNuevaOferta(!ofertaNueva)}
            className="flex items-center gap-2 py-2.5 px-5 rounded-full border border-trego-admin text-white bg-trego-admin hover:bg-indigo-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm shadow-indigo-200"
          >
            <Tag size={18} />
            <span className="font-semibold">Agregar oferta</span>
          </button>
        </div>

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
              ¡Producto modificado!
            </h2>
            <p className="text-gray-500 text-center max-w-sm">
              Los cambios ya están guardados en tu menú.
            </p>
            <button
              onClick={onReturn}
              className="mt-2 px-8 py-3 rounded-3xl bg-trego-restaurante text-white font-bold hover:bg-green-700 transition-colors"
            >
              Volver al listado
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
          <div className="bg-white rounded-3xl shadow-lg shadow-green-50 p-2 flex flex-col gap-1">
            {/* Renderizado condicional según tipo.id */}
            {producto.tipo === EnumTipoProducto.Plato && (
              <AltaPlato
                nombre={nombre ?? ""}
                descripcion={descripcion ?? ""}
                precio={precio ?? 0}
                subcategoria={subcategoriaSeleccionada}
                tiempoPreparacion={tiempoPreparacion ?? 0}
                foto={foto}
                onChangeNombre={setNombre}
                onChangeDescripcion={setDescripcion}
                onChangePrecio={setPrecio}
                onChangeSubCategoria={seleccionarSubcategoria}
                onChangeTiempoPrep={setTiempoPreparacion}
                onChangeImage={handleImageChange}
                onChangeListaDeIngredientes={handleListaIngredientesChange}
                error={errors}
                onChangeApiError={setApiError}
                categoria={categoriaFiltro}
                onChangeCategoria={(item) =>
                  handleCategoriaChange(item ?? EnumCategoriaProducto.Otros)
                }
                subcategorias={subcategoriasFiltradas}
                ingredientesIniciales={listaIngredientes}
              />
            )}

            {producto.tipo === EnumTipoProducto.Articulo && (
              <AltaArticulo
                nombre={nombre ?? ""}
                descripcion={descripcion ?? ""}
                precio={precio ?? 0}
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
                onChangeCategoria={(item) =>
                  handleCategoriaChange(item ?? EnumCategoriaProducto.Otros)
                }
              />
            )}

            {producto.tipo === EnumTipoProducto.Combo && (
              <AltaCombo
                nombre={nombre ?? ""}
                descripcion={descripcion ?? ""}
                precio={precio ?? 0}
                subcategoria={subcategoriaSeleccionada}
                foto={foto}
                onChangeNombre={setNombre}
                onChangeDescripcion={setDescripcion}
                onChangePrecio={setPrecio}
                onChangeSubCategoria={seleccionarSubcategoria}
                onChangeImage={handleImageChange}
                productosSeleccionados={productosDelCombo}
                onChangeListaProd={handleChangeListaProd}
                error={errors}
                onChangeApiError={setApiError}
                categoria={categoriaFiltro}
                onChangeCategoria={(item) =>
                  handleCategoriaChange(item ?? EnumCategoriaProducto.Otros)
                }
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

            {!deshabilitado ? (
              <div className="flex m-auto w-2xl pt-2">
                <button
                  onClick={handleHabilitar}
                  className="flex-1 py-3.5 px-6 rounded-3xl bg-trego-restaurante hover:bg-green-700 text-white text-base font-bold transition-all duration-200 shadow-md"
                >
                  Habilitar Producto
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3.5 px-6 rounded-3xl bg-trego-restaurante hover:bg-green-700 text-white text-base font-bold transition-all duration-200 shadow-md"
                >
                  Modificar Producto
                </button>
                <button
                  type="button"
                  onClick={handleAbrirModalEliminar}
                  className="flex-1 py-3.5 px-6 rounded-3xl border border-trego-orange text-trego-orange hover:bg-trego-orange hover:text-white  text-base font-semibold transition-all duration-200"
                >
                  Deshabilitar Producto
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmarEliminarProductoModal
        abierto={mostrarModalEliminar}
        nombreProducto={producto.nombre ?? ""}
        urlImagen={producto.urlImagen ?? null}
        eliminando={eliminando}
        error={errorEliminar}
        onCerrar={handleCerrarModalEliminar}
        onConfirmar={handleConfirmarEliminar}
      />
    </>
  );
}

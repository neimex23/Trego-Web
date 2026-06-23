import { useEffect, useState } from "react";
import type { NotificationState } from "../types/NotificationState.js";
import { useProductoRestaurante } from "../../../hooks/useProductoRestaurante.js";
import { AlertCircle, CheckCircle } from "lucide-react";
import FiltrosRestaurantes from "../componentes/FiltrosResto.js";
import { useFiltrosProductos } from "../../../hooks/useFiltrosProducto.js";
import type { DTOIngrediente } from "../../../data/DTOIngrediente.js";
import { useIngredientes } from "../../../hooks/useIngredientes.js";
import ProductoCard from "../componentes/CardProducto.js";
import type { DTOProducto } from "../../../data/DTOProducto.js";
import ModificarProducto from "./ModificarProducto.js";
import {
  RESTAURANTE_PAGE_CLASS,
  RestaurantePageHeader,
} from "../componentes/RestaurantePageShell.js";

export default function ListarProductos() {
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: "",
    type: "success",
  });

  const { productos, loadingProductos, errorProductos, recargarProductos } =
    useProductoRestaurante();

  const {
    hayFiltros,
    limpiarFiltros,
    orden,
    productosFiltrados,
    searchTerm,
    setIngredienteSeleccionadoId,
    setOrden,
    setSearchTerm,
    estadoFiltro,
    setEstadoFiltro,
  } = useFiltrosProductos(productos);

  const { listaIngredientesBackend } = useIngredientes();

  const [ingredienteSelec, setIngredienteSelec] = useState<DTOIngrediente>();

  const [productoSelect, setProductoSelect] = useState<DTOProducto>();

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "success" }),
      4000,
    );
  };

  useEffect(() => {
    if (errorProductos) showNotification(errorProductos, "error");
  }, [errorProductos]);

  useEffect(() => {
    if (errorProductos) showNotification(errorProductos, "error");
  }, [errorProductos]);

  const handleLimpiarFiltros = () => {
    limpiarFiltros();
    setIngredienteSelec(undefined);
  };

  if (productoSelect) {
    return (
      <ModificarProducto
        producto={productoSelect}
        onReturn={() => {
          setProductoSelect(undefined);
          recargarProductos();
        }}
        deshabilitado={productoSelect.disponible ?? true}
      />
    );
  }

  return (
    <div className={RESTAURANTE_PAGE_CLASS}>
      {notification.show && (
        <div
          className={`mb-4 p-4 rounded-xl flex items-center shadow-sm ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="mr-3" size={20} />
          ) : (
            <AlertCircle className="mr-3" size={20} />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <RestaurantePageHeader titulo="Mis Productos" />

      <div className="max-w-5xl mx-auto mb-6 sm:mb-8 relative group">
        <FiltrosRestaurantes
          labelBuscador="Buscar por Nombre o ID"
          nombreID={searchTerm}
          setNombreID={setSearchTerm}
          desplegableTipo="Ingredientes"
          orden={orden}
          setOrden={setOrden}
          hayFiltros={hayFiltros}
          limpiarFiltros={handleLimpiarFiltros}
          filtroSelecte={ingredienteSelec}
          onChangeFiltroSelect={(item) => {
            (setIngredienteSelec(item),
              setIngredienteSeleccionadoId(item?.idIngrediente));
          }}
          listaFiltros={listaIngredientesBackend}
          mapToItem={(i) => ({
            id: i?.toString() ?? "",
            label: i.nombre,
          })}
          onChangeEstadoFiltro={setEstadoFiltro}
          estadoFiltro={estadoFiltro}
        />
      </div>

      <div className="max-w-5xl mx-auto pb-10">
        {loadingProductos ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 font-medium flex items-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full"></span>
              Cargando Productos...
            </p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium text-lg">
              No hay productos encontrados.
            </p>
          </div>
        ) : (
          // Grid de dos columnas: 1 columna en móviles, 2 en tablets/escritorio
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productosFiltrados.map((prod) => (
              <ProductoCard
                producto={prod}
                onClick={() => setProductoSelect(prod)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

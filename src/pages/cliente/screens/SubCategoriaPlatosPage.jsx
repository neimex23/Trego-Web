import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IconBack } from "../../../components/icons.jsx";
import EmptyState from "../../../components/EmptyState.jsx";
import OfertaPlatoCard from "../../../components/OfertaPlatoCard.jsx";
import { useGeolocation } from "../../../hooks/useGeolocation.js";
import { useSubCategorias } from "../../../hooks/useSubCategorias.js";
import { obtenerRestaurantesZona } from "../../../api/restaurantesApi.js";
import { listarProductosPorSubcategoriaEnZona } from "../../../api/productosClienteApi.js";

export default function SubCategoriaPlatosPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const geo = useGeolocation(false);
  const { subcategorias } = useSubCategorias();

  const [platos, setPlatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const idSubCategoria = Number(id);

  const latitudRaw = geo.coords?.latitud;
  const longitudRaw = geo.coords?.longitud;

  const coordsEstabilizadas = useMemo(() => {
    if (latitudRaw === undefined || longitudRaw === undefined) return null;
    return {
      latitud: Math.round(latitudRaw * 10000) / 10000,
      longitud: Math.round(longitudRaw * 10000) / 10000,
    };
  }, [latitudRaw, longitudRaw]);

  const subcategoria = useMemo(() => {
    if (location.state?.subcategoria?.idSubCategoria === idSubCategoria) {
      return location.state.subcategoria;
    }
    return subcategorias.find((s) => s.idSubCategoria === idSubCategoria);
  }, [location.state, subcategorias, idSubCategoria]);

  const titulo = subcategoria?.nombre ?? "Platos";

  useEffect(() => {
    if (!geo.tieneUbicacion || !coordsEstabilizadas || !idSubCategoria) return;

    let activo = true;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const base = await obtenerRestaurantesZona(coordsEstabilizadas);
        const data = await listarProductosPorSubcategoriaEnZona(
          coordsEstabilizadas,
          idSubCategoria,
          base,
        );

        if (activo) {
          setPlatos(data);
        }
      } catch (e) {
        if (activo) {
          setError(e?.message ?? "No se pudieron cargar los platos");
          setPlatos([]);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, [geo.tieneUbicacion, coordsEstabilizadas, idSubCategoria]);

  const handleSeleccionar = useCallback(
    (item) => {
      if (!item.idRestaurante || !item.producto?.idProducto) return;

      navigate(
        `/restaurante/${item.idRestaurante}?abrirPlato=${item.producto.idProducto}`,
      );
    },
    [navigate],
  );

  if (!geo.tieneUbicacion) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="mx-auto w-full max-w-400 px-3 py-4 sm:px-6 sm:py-6">
          <Link
            to="/restaurantes"
            className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-gray-800 hover:text-trego-orange transition-colors"
          >
            <IconBack className="h-5 w-5" />
            Volver al inicio
          </Link>

          <div className="mt-8 flex flex-col items-center text-center">
            <EmptyState mensaje="Para ver los platos disponibles en tu área necesitamos tu ubicación" />
            <button
              onClick={() => geo.solicitar()}
              className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
            >
              Habilitar ubicación actual
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-400 px-3 py-4 sm:px-6 sm:py-6">
        <Link
          to="/restaurantes"
          className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-gray-800 hover:text-trego-orange transition-colors"
        >
          <IconBack className="h-5 w-5" />
          Volver al inicio
        </Link>

        <header className="mb-4">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            {titulo}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Platos disponibles en tu zona
          </p>
        </header>

        {cargando && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse">
              Buscando los mejores platos de la zona...
            </p>
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        {!cargando && !error && platos.length === 0 && (
          <EmptyState mensaje={`No hay platos de "${titulo}" en tu zona`} />
        )}

        {!cargando && platos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {platos.map((item) => (
              <OfertaPlatoCard
                key={`${item.idRestaurante}-${item.producto?.idProducto}`}
                oferta={item}
                enGrid
                onSeleccionar={handleSeleccionar}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

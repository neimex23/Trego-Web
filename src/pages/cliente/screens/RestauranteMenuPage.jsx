import { Link, useParams, useSearchParams } from "react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import MenuSidebar from "../../../components/menu/MenuSidebar.jsx";
import ComentariosRestaurantePanel from "../../../components/menu/ComentariosRestaurantePanel.jsx";
import { IconBack, IconTag } from "../../../components/icons.jsx";
import { useCarrito } from "../../../context/CarritoContext";
import { useMenuRestaurante } from "../../../hooks/useMenuRestaurante.js";
import ProductoMenuCard from "../../../components/menu/ProductoMenuCard.js";
import OfertaCard from "../../../components/menu/OfertaCard.js";
import RestauranteBanner from "../../../components/menu/RestauranteBanner.js";
import { useBusqueda } from "../../../context/BusquedaContext.js";
import { useDebounce } from "../../../hooks/useDebounce.js";

export default function RestauranteMenuPage() {
  const { id } = useParams();
  const { abrirDetalleProducto, validarRestauranteAbierto } = useCarrito();

  const [resenasInfo, setResenasInfo] = useState(null);
  const { busqueda } = useBusqueda({ placeholder: "Buscar en el menú..." });
  const debouncedBusqueda = useDebounce(busqueda, 500);
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    menu,
    cargando,
    error,
    categoria,
    setCategoria,
    ordenPrecio,
    setOrdenPrecio,
    productosFiltrados,
    ofertas,
    sinProductos,
    sinProductosEnCategoria,
  } = useMenuRestaurante(id);

  const restaurante = menu?.restaurante;
  const restauranteAbierto = restaurante?.abierto;

  useEffect(() => {
    if (restaurante) {
      validarRestauranteAbierto(restauranteAbierto);
    }
  }, [restaurante, restauranteAbierto, validarRestauranteAbierto]);

  useEffect(() => {
    const idOferta = searchParams.get("abrirOferta");

    if (idOferta && !cargando && !error && restaurante) {
      const productoAabrir =
        ofertas?.find((p) => String(p.idProducto) === idOferta) ||
        productosFiltrados?.find((p) => String(p.idProducto) === idOferta);

      if (productoAabrir) {
        abrirDetalleProducto(productoAabrir, restaurante);
      }
      searchParams.delete("abrirOferta");
      setSearchParams(searchParams, { replace: true });
    }
  }, [
    searchParams,
    cargando,
    error,
    restaurante,
    ofertas,
    productosFiltrados,
    abrirDetalleProducto,
    setSearchParams,
  ]);

  useEffect(() => {
    const idOferta = searchParams.get("abrirOferta");
    const idPlato = searchParams.get("abrirPlato");
    const idTarget = idOferta || idPlato;

    if (idTarget && !cargando && !error && restaurante) {
      const productoAabrir =
        ofertas?.find((p) => String(p.idProducto) === idTarget) ||
        productosFiltrados?.find((p) => String(p.idProducto) === idTarget);

      if (productoAabrir) {
        abrirDetalleProducto(productoAabrir, restaurante);
      }

      if (idOferta) searchParams.delete("abrirOferta");
      if (idPlato) searchParams.delete("abrirPlato");
      setSearchParams(searchParams, { replace: true });
    }
  }, [
    searchParams,
    cargando,
    error,
    restaurante,
    ofertas,
    productosFiltrados,
    abrirDetalleProducto,
    setSearchParams,
  ]);

  const handleAgregar = useCallback(
    (producto) => {
      abrirDetalleProducto(producto, restaurante);
    },
    [abrirDetalleProducto, restaurante],
  );

  const productosVisibles = useMemo(() => {
    const term = debouncedBusqueda.trim().toLowerCase();
    if (!term) return productosFiltrados;

    return productosFiltrados.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(term) ||
        p.descripcion?.toLowerCase().includes(term),
    );
  }, [productosFiltrados, debouncedBusqueda]);

  const ofertasVisibles = useMemo(() => {
    const term = debouncedBusqueda.trim().toLowerCase();
    if (!term) return ofertas;
    return ofertas.filter((p) => p.nombre?.toLowerCase().includes(term));
  }, [ofertas, debouncedBusqueda]);

  if (cargando) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
          <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse">
            Cargando menú...
          </p>
        </div>
      </PageShell>
    );
  }

  if (error || !menu) {
    return (
      <PageShell>
        <NavBack />
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-center text-red-600">
            {error ?? "No se pudo cargar el menú"}
          </p>
        </div>
      </PageShell>
    );
  }

  if (restaurante && !restaurante.habilitado) {
    return (
      <PageShell>
        <NavBack />
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-center text-gray-600">
            Este restaurante no está disponible.
          </p>
        </div>
      </PageShell>
    );
  }

  if (sinProductos) {
    return (
      <PageShell>
        <NavBack />
        {restaurante ? <RestauranteBanner restaurante={restaurante} /> : null}
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-lg text-gray-600">
            {menu.mensaje ?? "Este restaurante aún no ha cargado su menú"}
          </p>
          <Link
            to="/restaurantes"
            className="rounded-xl bg-trego-orange px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Volver al listado
          </Link>
        </div>
      </PageShell>
    );
  }

  const mostrarOfertas = ofertas.length > 0 && !categoria;
  const cantidadResenas =
    resenasInfo?.cantidadResenas ?? restaurante?.cantidadResenas ?? 0;

  return (
    <PageShell>
      <NavBack />
      <RestauranteBanner
        restaurante={restaurante}
        cantidadResenas={cantidadResenas}
      />

      <div className="mt-5 flex flex-col gap-5 lg:mt-6 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-60">
          <MenuSidebar
            categoria={categoria}
            onCategoriaChange={setCategoria}
            ordenPrecio={ordenPrecio}
            onOrdenChange={setOrdenPrecio}
          />
          <ComentariosRestaurantePanel
            idRestaurante={id}
            onResenasActualizadas={setResenasInfo}
          />
        </div>

        <div className="min-w-0 flex-1">
          {mostrarOfertas && (
            <section className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-[17px] font-bold text-gray-900">
                <IconTag className="h-5 w-5 text-trego-orange" />
                Ofertas del dia
              </h2>
              <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-3 scrollbar-thin">
                {ofertasVisibles.map((p) => (
                  <OfertaCard
                    key={p.idProducto}
                    producto={p}
                    onClick={() => handleAgregar(p)}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-[17px] font-bold text-gray-900">
              Todos los Productos
            </h2>

            {sinProductosEnCategoria ? (
              <p className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-600">
                No hay productos disponibles en esta categoría
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {productosVisibles.map((p) => (
                  <li key={p.idProducto}>
                    <ProductoMenuCard producto={p} onAgregar={handleAgregar} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
function PageShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-275 flex-1 px-4 py-3 sm:px-6 sm:py-4">
        {children}
      </div>
    </div>
  );
}

function NavBack() {
  return (
    <Link
      to="/restaurantes"
      className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-gray-800 hover:text-trego-orange transition-colors"
    >
      <IconBack className="h-5 w-5" />
      Lista de Restaurantes
    </Link>
  );
}

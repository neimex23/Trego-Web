const optimizarImagen = (url: string | undefined, ancho: number, alto: number): string => {
  if (!url || url.includes("placeholder")) return "/placeholder.png";

  // Busca "/upload/w_algo,h_algo..." y lo reemplaza por el nuevo tamaño
  if (url.match(/\/upload\/w_\d+,h_\d+(,c_[^/]+)?/)) {
    return url.replace(
      /\/upload\/w_\d+,h_\d+(,c_[^/]+)?/, 
      `/upload/w_${ancho},h_${alto},c_fill,g_auto`
    );
  }

  // Si la URL está limpia
  if (url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/w_${ancho},h_${alto},c_fill,g_auto/`);
  }

  return url;
};


// Estas son las que vas a importar y usar en tus componentes de React.

/**
 * Para listas, avatares o miniaturas cuadradas (160x160)
 */
export const obtenerThumbnail = (url: string | undefined) => {
  return optimizarImagen(url, 200, 200);
};

/**
 * Para las tarjetas de ofertas horizontales en la web (600x200)
 */
export const obtenerBannerOferta = (url: string | undefined) => {
  return optimizarImagen(url, 600, 200);
};

/**
 * Para la vista principal del producto o banners grandes en Android (800x350)
 */
export const obtenerImagenProducto = (url: string | undefined) => {
  return optimizarImagen(url, 800, 350);
};

/**
 * Para las tarjetas de oferta estrechas (400x320)
 */
export const obtenerImagenOfertaCard = (url: string | undefined) => {
  return optimizarImagen(url, 400, 320);
};

/**
 * Para las tarjetas de restaurantes en el listado (120x1200)
 */
export const obtenerImagenRestauranteCard = (url: string | undefined) => {
  return optimizarImagen(url, 120, 120);
};
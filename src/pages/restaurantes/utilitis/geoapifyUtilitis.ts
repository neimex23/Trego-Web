import type { DireccionGeoapify } from "../../../data/DireccionGeoapify.js";

// ─── API ──────────────────────────────────────────────────────────────────────
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

// Coordenadas de Montevideo para sesgar resultados hacia esa zona
const MONTEVIDEO_BIAS = "proximity:-56.1674,-34.9011";

export async function buscarDireccionesGeoapify(
  query: string,
  signal?: AbortSignal
): Promise<DireccionGeoapify[]> {
  const params = new URLSearchParams({
    text: query,
    apiKey: GEOAPIFY_API_KEY || "",
    lang: "es",
    limit: "6",
    filter: "circle:-56.1674,-34.9011,25000|countrycode:uy",
    bias: MONTEVIDEO_BIAS,
  });

  const res = await fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?${params}`,
    { signal: signal ?? null }
  );

  if (!res.ok) throw new Error(`Geoapify error ${res.status}`);

  const data = await res.json();

  return (
    (data.features ?? [])
      .map((feature: any) => {
        const p = feature.properties;

        return {
          calle: p.street ?? p.address_line1 ?? "",
          numero: p.housenumber ?? "",
          direccionCompleta: p.formatted ?? "",
          esquina: p.street_junction ?? "",
          latitud: p.lat,
          longitud: p.lon,
        } satisfies DireccionGeoapify;
      })
      // Filtrar resultados sin calle (zonas genéricas sin valor)
      .filter((d: DireccionGeoapify) => d.calle.length > 0)
  );
}

/**
 * Obtiene las coordenadas actuales del dispositivo usando el GPS del navegador.
 */
export const obtenerCoordenadasGPS = (): Promise<{ latitud: number; longitud: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Tu navegador no soporta la función de ubicación."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("Permiso denegado. Habilitá la ubicación en tu navegador para usar esta función."));
        } else {
          reject(new Error("No pudimos obtener tu ubicación. Intentá buscarla manualmente."));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
};

/**
 * Llama a Geoapify para traducir latitud y longitud a una dirección legible.
 * Ahora devuelve exactamente la interfaz DireccionGeoapify.
 */
export const obtenerDireccionPorCoordenadas = async (lat: number, lon: number): Promise<DireccionGeoapify> => {
  
  const response = await fetch(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error("Hubo un problema de conexión al buscar tu dirección.");
  }
  
  const data = await response.json();

  if (data.features && data.features.length > 0) {
    const properties = data.features[0].properties;
    
    const calle = properties.street || properties.name || "";
    const numero = properties.housenumber || "";
    const direccionCompleta = properties.formatted || `${calle} ${numero}`.trim();
    const esquina = ""; 

    if (!calle) {
      throw new Error("Ubicación encontrada, pero no pudimos determinar el nombre de la calle. Por favor, buscala manualmente.");
    }

    return {
      direccionCompleta,
      calle,
      numero,
      esquina,
      latitud: lat,
      longitud: lon,
    };
  } else {
    throw new Error("No pudimos encontrar una dirección válida para tu ubicación actual.");
  }
};

/**
 * Función que pide el GPS y devuelve la dirección tipada con DireccionGeoapify
 */
export const autocompletarDesdeGPS = async (): Promise<DireccionGeoapify> => {
  const { latitud, longitud } = await obtenerCoordenadasGPS();
  return await obtenerDireccionPorCoordenadas(latitud, longitud);
};
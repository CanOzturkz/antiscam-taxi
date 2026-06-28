import Constants from 'expo-constants';

/**
 * Google Directions API entegrasyonu.
 * API key app.json -> expo.extra.googleMapsApiKey içine konur (ya da EAS secret).
 *
 * Anlık trafik için `departure_time=now` + `duration_in_traffic` kullanılır.
 * Bu, taksimetre tahmininin gerçeğe en yakın olması için kritiktir.
 */

export function getApiKey(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { googleMapsApiKey?: string };
  return extra.googleMapsApiKey ?? '';
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceKm: number;
  /** Trafiksiz tahmini süre (dk) */
  durationMin: number;
  /** Anlık trafiğe göre tahmini süre (dk) — duration_in_traffic */
  durationInTrafficMin: number;
  /** Trafikte/beklemede geçeceği tahmin edilen ek süre (dk) */
  estimatedWaitingMin: number;
  startAddress: string;
  endAddress: string;
  /** Başlangıç/varış koordinatları (haritada işaretlemek için) */
  startLocation: LatLng;
  endLocation: LatLng;
  /** Rota çizgisi için encoded polyline (haritada çizmek için) */
  polyline: string;
  /** Geçiş ücreti tespiti için rota metni (özet + adım talimatları + adresler, küçük harf) */
  tollText: string;
}

export class DirectionsError extends Error {}

/**
 * İki nokta arası rotayı anlık trafikle hesaplar.
 * origin/destination: "lat,lng" ya da serbest metin adres olabilir.
 */
export async function getRoute(
  origin: string,
  destination: string
): Promise<RouteResult> {
  const key = getApiKey();
  if (!key) {
    throw new DirectionsError('NO_API_KEY');
  }

  const params = new URLSearchParams({
    origin,
    destination,
    mode: 'driving',
    departure_time: 'now', // anlık trafik için şart
    traffic_model: 'best_guess',
    language: 'en',
    key,
  });

  const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new DirectionsError(`HTTP_${res.status}`);

  const data = await res.json();
  if (data.status !== 'OK' || !data.routes?.length) {
    throw new DirectionsError(data.status || 'NO_ROUTE');
  }

  const route = data.routes[0];
  const leg = route.legs[0];
  const distanceKm = leg.distance.value / 1000;
  const durationMin = leg.duration.value / 60;
  const durationInTrafficMin = (leg.duration_in_traffic?.value ?? leg.duration.value) / 60;
  const estimatedWaitingMin = Math.max(0, durationInTrafficMin - durationMin);

  // Geçiş ücreti tespiti için: rota özeti + adım talimatları + adresler
  const stripHtml = (s: string) => (s || '').replace(/<[^>]*>/g, ' ');
  const steps: string = (leg.steps ?? [])
    .map((st: any) => stripHtml(st.html_instructions))
    .join(' ');
  const tollText = [route.summary, steps, leg.start_address, leg.end_address]
    .join(' ')
    .toLowerCase();

  return {
    distanceKm,
    durationMin,
    durationInTrafficMin,
    estimatedWaitingMin,
    startAddress: leg.start_address,
    endAddress: leg.end_address,
    startLocation: { lat: leg.start_location.lat, lng: leg.start_location.lng },
    endLocation: { lat: leg.end_location.lat, lng: leg.end_location.lng },
    polyline: route.overview_polyline?.points ?? '',
    tollText,
  };
}

/** Serbest metin adresi koordinata çevirir (Geocoding API). */
export async function geocode(address: string): Promise<LatLng | null> {
  const key = getApiKey();
  if (!key) return null;
  const params = new URLSearchParams({ address, key, language: 'en' });
  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const loc = data.results?.[0]?.geometry?.location;
  return loc ? { lat: loc.lat, lng: loc.lng } : null;
}

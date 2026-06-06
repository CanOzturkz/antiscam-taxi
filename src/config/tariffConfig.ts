import localTariffs from './tariffs.json';

// AsyncStorage opsiyonel: paket yüklü değilse uygulama yine çalışır (sadece bundle'daki config kullanılır).
// Lazy require sayesinde paket kurulu olmasa bile bundler patlamaz.
interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
let AsyncStorage: AsyncStorageLike | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  AsyncStorage = null;
}

export interface TaxiType {
  label: string;
  labelEn: string;
  /** Açılış ücreti (TL) */
  opening: number;
  /** Kilometre başına ücret (TL) */
  perKm: number;
  /** Bekleme/trafik — dakika başına ücret (TL) */
  perMinuteWaiting: number;
  /** İndi-bindi: minimum ücret (TL) */
  minimumFare: number;
}

export interface Toll {
  id: string;
  label: string;
  fee: number;
  note?: string;
}

export interface CityTariff {
  name: string;
  country: string;
  currency: string;
  singleTariff: boolean;
  note?: string;
  defaultTaxiType: string;
  taxiTypes: Record<string, TaxiType>;
  tolls: Toll[];
}

export interface TariffConfig {
  schemaVersion: number;
  tariffVersion: string;
  source: string;
  lastVerified: string;
  defaultCity: string;
  remoteConfigUrl: string;
  cities: Record<string, CityTariff>;
}

const STORAGE_KEY = 'tariffConfig.v1';

// Bellekteki aktif config (varsayılan: bundle ile gelen JSON)
let activeConfig: TariffConfig = localTariffs as TariffConfig;

export function getConfig(): TariffConfig {
  return activeConfig;
}

export function getCity(cityId?: string): CityTariff {
  const id = cityId ?? activeConfig.defaultCity;
  return activeConfig.cities[id] ?? activeConfig.cities[activeConfig.defaultCity];
}

export function getTaxiType(cityId?: string, taxiTypeId?: string): TaxiType {
  const city = getCity(cityId);
  const id = taxiTypeId ?? city.defaultTaxiType;
  return city.taxiTypes[id] ?? city.taxiTypes[city.defaultTaxiType];
}

export function listCities(): { id: string; name: string }[] {
  return Object.entries(activeConfig.cities).map(([id, c]) => ({ id, name: c.name }));
}

export function listTaxiTypes(cityId?: string): { id: string; label: string }[] {
  const city = getCity(cityId);
  return Object.entries(city.taxiTypes).map(([id, t]) => ({ id, label: t.label }));
}

/**
 * Uygulama açılışında çağrılır: daha önce indirilmiş uzak config varsa belleğe yükler.
 */
export async function loadCachedConfig(): Promise<void> {
  if (!AsyncStorage) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const cached = JSON.parse(raw) as TariffConfig;
    // Sadece bundle'dakinden yeni veya eşit şema ise kullan
    if (cached.schemaVersion === activeConfig.schemaVersion && cached.tariffVersion >= activeConfig.tariffVersion) {
      activeConfig = cached;
    }
  } catch {
    // sessizce bundle config ile devam
  }
}

/**
 * Mağaza güncellemesi gerekmeden tarifeleri günceller.
 * remoteConfigUrl üzerinden yeni JSON çeker, doğrular, cache'e yazar.
 */
export async function refreshRemoteConfig(url?: string): Promise<boolean> {
  const target = url || activeConfig.remoteConfigUrl;
  if (!target) return false;
  try {
    const res = await fetch(target, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) return false;
    const next = (await res.json()) as TariffConfig;
    if (!next.cities || typeof next.schemaVersion !== 'number') return false;
    if (next.schemaVersion !== activeConfig.schemaVersion) return false; // şema uyumsuz
    activeConfig = next;
    if (AsyncStorage) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    return true;
  } catch {
    return false;
  }
}

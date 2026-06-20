// Dinamik Expo config: Google Maps API anahtarını .env'den okur.
// Anahtar GİT'E GİRMEZ (.env gitignore'da). Böylece public repo'da sızmaz.
// .env içine: GOOGLE_MAPS_API_KEY=AIza...

module.exports = ({ config }) => {
  const key = process.env.GOOGLE_MAPS_API_KEY || '';
  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      googleMapsApiKey: key, // Directions + Geocoding (REST çağrıları) için
    },
    android: {
      ...(config.android || {}),
      config: {
        ...((config.android && config.android.config) || {}),
        googleMaps: { apiKey: key }, // react-native-maps Android haritası için
      },
    },
    ios: {
      ...(config.ios || {}),
      config: {
        ...((config.ios && config.ios.config) || {}),
        googleMapsApiKey: key, // react-native-maps iOS haritası için
      },
    },
  };
};

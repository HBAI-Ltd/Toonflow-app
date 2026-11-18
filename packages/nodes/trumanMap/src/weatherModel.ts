import type { SceneWeather } from "./sceneDocument";

export const weatherLayerKeys = ["clouds", "rain", "snow", "fog", "hail", "thunder", "dust", "sandstorm", "haze", "blizzard", "aurora", "rainbow", "meteors"] as const;
export type WeatherLayerKey = typeof weatherLayerKeys[number];

function unit(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function getWeatherLayers(weather?: SceneWeather): Record<WeatherLayerKey, number> {
  const layers: Partial<Record<WeatherLayerKey, number>> = weather?.layers ?? {
    clouds: Number(weather?.condition === "cloudy"), rain: Number(weather?.condition === "rain"),
    snow: Number(weather?.condition === "snow"), fog: Number(weather?.condition === "fog"),
  };
  return Object.fromEntries(weatherLayerKeys.map(key => [key, unit(layers[key])])) as Record<WeatherLayerKey, number>;
}

export function getWeatherStrengths(weather?: SceneWeather): Record<WeatherLayerKey, number> {
  const layers = getWeatherLayers(weather);
  const intensity = unit(weather?.intensity);
  return Object.fromEntries(weatherLayerKeys.map(key => [key, layers[key] * intensity])) as Record<WeatherLayerKey, number>;
}

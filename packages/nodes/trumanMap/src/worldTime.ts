import { getMoonIllumination, getMoonPosition, getPosition, getTimes } from "suncalc";
import type { SceneDocument, SceneTime, Vector3Value } from "./sceneDocument";

const dayMilliseconds = 86400000;
const radians = Math.PI / 180;

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothstep(minimum: number, maximum: number, value: number) {
  const progress = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function dayStart(date: string) {
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(timestamp) ? timestamp : Date.parse(`${localDate()}T00:00:00Z`);
}

function getUtcDate(time: SceneTime) {
  return new Date(dayStart(time.date) + (time.hour - (time.utcOffset ?? 8)) * 3600000);
}

export function getSceneTime(document: Pick<SceneDocument, "time" | "weather">): SceneTime {
  return {
    date: localDate(),
    hour: document.weather?.hour ?? (document.weather?.timeOfDay === "sunset" ? 18 : document.weather?.timeOfDay === "night" ? 0 : 12),
    latitude: document.time ? 35 : 39.9042,
    longitude: document.time ? 120 : 116.4074,
    utcOffset: 8,
    northOffset: 0,
    speed: 1,
    paused: false,
    moonIntensity: 1,
    starIntensity: 1,
    ...document.time,
  };
}

export function advanceSceneTime(time: SceneTime, elapsedSeconds: number): SceneTime {
  const elapsed = time.paused || !Number.isFinite(elapsedSeconds) ? 0 : Math.max(0, elapsedSeconds) * time.speed;
  // ACT: 公历跨日采用UTC容器运算，民用时偏移只在天文计算时转换；设备夏令时不暗改场景时间。
  const timestamp = dayStart(time.date) + time.hour * 3600000 + elapsed * 1000;
  const date = new Date(clamp(timestamp, Date.UTC(1900, 0, 1), Date.UTC(2201, 0, 1) - 1));
  return { ...time, date: date.toISOString().slice(0, 10), hour: date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600 + date.getUTCMilliseconds() / 3600000 };
}

export type SunTimes = { sunrise: number | null; sunset: number | null; noon: number; polarDay: boolean; polarNight: boolean };
let cachedSunTimes: { key: string; value: SunTimes } | undefined;

export function getSunTimes(time: SceneTime): SunTimes {
  const longitude = time.longitude ?? 120;
  const offset = time.utcOffset ?? 8;
  const key = [time.date, time.latitude, longitude, offset].join("/");
  if (cachedSunTimes?.key === key) return cachedSunTimes.value;
  // 固定在同一民用日正午，播放或拖动时刻不会切到临近日的日出日落。
  const times = getTimes(getUtcDate({ ...time, hour: 12 }), time.latitude, longitude, 0, offset * 60);
  const hour = (date: Date) => ((date.getTime() - dayStart(time.date)) / 3600000 + offset + 48) % 24;
  const value = { sunrise: times.sunrise ? hour(times.sunrise) : null, sunset: times.sunset ? hour(times.sunset) : null, noon: hour(times.solarNoon), polarDay: !!times.alwaysUp, polarNight: !!times.alwaysDown };
  cachedSunTimes = { key, value };
  return value;
}

function normalize(direction: Vector3Value): Vector3Value {
  const length = Math.hypot(direction.x, direction.y, direction.z) || 1;
  return { x: direction.x / length, y: direction.y / length, z: direction.z / length };
}

export function getCelestialState(time: SceneTime) {
  const date = getUtcDate(time);
  const longitude = time.longitude ?? 120;
  const sun = getPosition(date, time.latitude, longitude);
  const moon = getMoonPosition(date, time.latitude, longitude);
  const illumination = getMoonIllumination(date);
  const northOffset = time.northOffset * radians;
  function direction(azimuth: number, altitude: number): Vector3Value {
    // SunCalc 2使用北0/东90，场景为东+X/南+Z；统一在这里转换并绕世界北向旋转。
    const azimuthAngle = azimuth * radians;
    const altitudeAngle = altitude * radians;
    const east = Math.cos(altitudeAngle) * Math.sin(azimuthAngle);
    const south = -Math.cos(altitudeAngle) * Math.cos(azimuthAngle);
    return { x: Math.cos(northOffset) * east - Math.sin(northOffset) * south, y: Math.sin(altitudeAngle), z: Math.sin(northOffset) * east + Math.cos(northOffset) * south };
  }
  const sunDirection = direction(sun.azimuth, sun.altitude);
  let moonDirection = direction(moon.azimuth, moon.altitude);
  const moonPhase = time.moonPhase === undefined ? illumination.phase : ((time.moonPhase % 1) + 1) % 1;
  const moonIllumination = time.moonPhase === undefined ? illumination.fraction : (1 - Math.cos(moonPhase * Math.PI * 2)) / 2;
  if (time.moonPhase !== undefined) {
    // ACT: 手动月相属于美术覆盖，用近似黄道圆轨道同步升落；自动模式始终采用真实日期的月球轨道与近地视差。
    const julianDays = date.getTime() / dayMilliseconds + 2440587.5 - 2451545;
    const sidereal = (280.46061837 + 360.98564736629 * julianDays + longitude) * radians;
    const latitude = time.latitude * radians;
    const tilt = 23.4393 * radians;
    const east = -Math.sin(tilt) * Math.cos(sidereal);
    const up = -Math.cos(latitude) * Math.sin(tilt) * Math.sin(sidereal) + Math.sin(latitude) * Math.cos(tilt);
    const south = -Math.sin(latitude) * Math.sin(tilt) * Math.sin(sidereal) - Math.cos(latitude) * Math.cos(tilt);
    const axis = normalize({ x: Math.cos(northOffset) * east - Math.sin(northOffset) * south, y: up, z: Math.sin(northOffset) * east + Math.cos(northOffset) * south });
    const angle = moonPhase * Math.PI * 2;
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    const dot = axis.x * sunDirection.x + axis.y * sunDirection.y + axis.z * sunDirection.z;
    moonDirection = normalize({
      x: sunDirection.x * cosine + (axis.y * sunDirection.z - axis.z * sunDirection.y) * sine + axis.x * dot * (1 - cosine),
      y: sunDirection.y * cosine + (axis.z * sunDirection.x - axis.x * sunDirection.z) * sine + axis.y * dot * (1 - cosine),
      z: sunDirection.z * cosine + (axis.x * sunDirection.y - axis.y * sunDirection.x) * sine + axis.z * dot * (1 - cosine),
    });
  }
  const dayOfYear = Math.floor((dayStart(time.date) - Date.UTC(Number(time.date.slice(0, 4)), 0, 1)) / dayMilliseconds) + 1;
  const anomaly = (357.529 + 0.98560028 * (date.getTime() / dayMilliseconds - 10957.5)) * radians;
  const sunDistance = 1.00014 - 0.01671 * Math.cos(anomaly) - 0.00014 * Math.cos(2 * anomaly);
  const moonLightDirection = normalize({ x: sunDirection.x * sunDistance * 149597870.7 - moonDirection.x * moon.distance, y: sunDirection.y * sunDistance * 149597870.7 - moonDirection.y * moon.distance, z: sunDirection.z * sunDistance * 149597870.7 - moonDirection.z * moon.distance });
  return { sunDirection, moonDirection, moonPhase, moonIllumination, moonLightDirection, moonDistance: moon.distance, sunDistance, moonAngularRadius: Math.asin(1737.4 / moon.distance), sunAngularRadius: Math.asin(695700 / (sunDistance * 149597870.7)), night: 1 - smoothstep(-18, -4, sun.altitude), dayOfYear };
}

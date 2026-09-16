import http from 'http';
import https from 'https';

export interface WeatherData {
  temp: number;
  precipitation: number;
  isNight: boolean;
  condition: 'RAIN' | 'NIGHT' | 'EXTREME_TEMP' | 'CLEAR';
  description: string;
  modifiers: {
    bonusXp: number;
    bonusGold: number;
    goldMultiplier: number;
    doubleQuests: boolean;
  };
}

let cachedWeather: WeatherData = {
  temp: 20,
  precipitation: 0,
  isNight: false,
  condition: 'CLEAR',
  description: 'Clima Templado (Sin Bonus)',
  modifiers: { bonusXp: 0, bonusGold: 0, goldMultiplier: 1.0, doubleQuests: false }
};

let lastFetchTime = 0;

export async function fetchCurrentWeather(lat: number = -34.6037, lon: number = -58.3816): Promise<WeatherData> {
  const now = Date.now();
  // Cache for 15 minutes
  if (now - lastFetchTime < 15 * 60 * 1000) {
    return cachedWeather;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,is_day`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const current = json.current || {};
          const temp = current.temperature_2m || 20;
          const precip = current.precipitation || 0;
          const isDay = current.is_day === 1;

          const currentHour = new Date().getHours();
          const isNight = currentHour >= 21 || currentHour < 4 || !isDay;

          let condition: 'RAIN' | 'NIGHT' | 'EXTREME_TEMP' | 'CLEAR' = 'CLEAR';
          let bonusXp = 0;
          let bonusGold = 0;
          let goldMultiplier = 1.0;
          let doubleQuests = false;
          const descParts: string[] = [];

          if (precip > 0.5) {
            condition = 'RAIN';
            bonusXp += 35;
            bonusGold += 15;
            descParts.push('🌧️ Lluvia/Tormenta (+35 XP, +15 Oro)');
          }

          if (isNight) {
            goldMultiplier += 0.25;
            descParts.push('🌙 Noche de Taberna (+25% Oro)');
          }

          if (temp < 8 || temp > 34) {
            doubleQuests = true;
            descParts.push(`❄️ Clima Extremo (${temp}°C - Doble Progreso)`);
          }

          if (descParts.length === 0) {
            descParts.push('☀️ Día Templado (Clima Estándar)');
          }

          cachedWeather = {
            temp,
            precipitation: precip,
            isNight,
            condition,
            description: descParts.join(' | '),
            modifiers: { bonusXp, bonusGold, goldMultiplier, doubleQuests }
          };
          lastFetchTime = now;
          resolve(cachedWeather);
        } catch (e) {
          resolve(cachedWeather);
        }
      });
    }).on('error', () => {
      resolve(cachedWeather);
    });
  });
}

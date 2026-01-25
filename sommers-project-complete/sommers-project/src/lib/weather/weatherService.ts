/**
 * Weather Service
 * Weather integration for job scheduling
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface WeatherForecast {
  date: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  precipitation: number;
  conditions: string;
  icon: string;
  windSpeed: number;
  workSuitable: boolean;
  workReason?: string;
}

export interface WeatherAlert {
  type: 'warning' | 'watch' | 'advisory';
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface WorkabilityAssessment {
  canWork: boolean;
  confidence: number;
  reasons: string[];
  recommendations: string[];
}

// Sealcoating work conditions
const WORK_CONDITIONS = {
  minTemp: 50, // °F
  maxTemp: 95,
  maxHumidity: 85,
  maxPrecipitationChance: 30,
  maxWindSpeed: 20, // mph
  minDryHours: 24, // hours after rain
};

// ============================================================================
// FETCH WEATHER
// ============================================================================

export async function getWeatherForecast(
  lat: number,
  lon: number,
  days: number = 7
): Promise<WeatherForecast[]> {
  const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenWeatherMap API key not configured');
    return getMockForecast(days);
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();
    
    // Group by day and transform
    const dailyData: Record<string, WeatherForecast> = {};

    data.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          temp: item.main.temp,
          tempMin: item.main.temp_min,
          tempMax: item.main.temp_max,
          humidity: item.main.humidity,
          precipitation: (item.pop || 0) * 100,
          conditions: item.weather[0].main,
          icon: item.weather[0].icon,
          windSpeed: item.wind.speed,
          workSuitable: false,
        };
      } else {
        // Update min/max temps
        dailyData[date].tempMin = Math.min(dailyData[date].tempMin, item.main.temp_min);
        dailyData[date].tempMax = Math.max(dailyData[date].tempMax, item.main.temp_max);
        dailyData[date].precipitation = Math.max(dailyData[date].precipitation, (item.pop || 0) * 100);
      }
    });

    // Assess workability for each day
    return Object.values(dailyData)
      .slice(0, days)
      .map((day) => ({
        ...day,
        ...assessWorkability(day),
      }));
  } catch (error) {
    console.error('Weather fetch error:', error);
    return getMockForecast(days);
  }
}

// ============================================================================
// WORKABILITY ASSESSMENT
// ============================================================================

export function assessWorkability(forecast: Partial<WeatherForecast>): { 
  workSuitable: boolean; 
  workReason?: string;
} {
  const reasons: string[] = [];

  // Temperature check
  if ((forecast.temp || 0) < WORK_CONDITIONS.minTemp) {
    reasons.push(`Temperature too low (${forecast.temp}°F < ${WORK_CONDITIONS.minTemp}°F)`);
  }
  if ((forecast.temp || 0) > WORK_CONDITIONS.maxTemp) {
    reasons.push(`Temperature too high (${forecast.temp}°F > ${WORK_CONDITIONS.maxTemp}°F)`);
  }

  // Humidity check
  if ((forecast.humidity || 0) > WORK_CONDITIONS.maxHumidity) {
    reasons.push(`Humidity too high (${forecast.humidity}% > ${WORK_CONDITIONS.maxHumidity}%)`);
  }

  // Precipitation check
  if ((forecast.precipitation || 0) > WORK_CONDITIONS.maxPrecipitationChance) {
    reasons.push(`Rain likely (${forecast.precipitation}% chance)`);
  }

  // Wind check
  if ((forecast.windSpeed || 0) > WORK_CONDITIONS.maxWindSpeed) {
    reasons.push(`Wind too strong (${forecast.windSpeed} mph)`);
  }

  // Condition check
  const badConditions = ['Rain', 'Thunderstorm', 'Snow', 'Drizzle'];
  if (badConditions.includes(forecast.conditions || '')) {
    reasons.push(`Weather conditions: ${forecast.conditions}`);
  }

  return {
    workSuitable: reasons.length === 0,
    workReason: reasons.length > 0 ? reasons.join('; ') : undefined,
  };
}

// ============================================================================
// DETAILED ASSESSMENT
// ============================================================================

export function getDetailedAssessment(forecast: WeatherForecast): WorkabilityAssessment {
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let confidence = 100;

  // Temperature
  if (forecast.temp < WORK_CONDITIONS.minTemp) {
    reasons.push('Temperature below minimum threshold');
    recommendations.push('Wait for warmer weather or use temperature-specific products');
    confidence -= 40;
  } else if (forecast.temp > WORK_CONDITIONS.maxTemp) {
    reasons.push('Temperature above maximum threshold');
    recommendations.push('Schedule work for early morning');
    confidence -= 30;
  } else if (forecast.temp >= 60 && forecast.temp <= 85) {
    recommendations.push('Ideal temperature for sealcoating');
  }

  // Humidity
  if (forecast.humidity > WORK_CONDITIONS.maxHumidity) {
    reasons.push('High humidity may affect curing');
    recommendations.push('Allow extra drying time');
    confidence -= 20;
  }

  // Precipitation
  if (forecast.precipitation > WORK_CONDITIONS.maxPrecipitationChance) {
    reasons.push('Significant rain chance');
    recommendations.push('Have backup date ready');
    confidence -= 30;
  } else if (forecast.precipitation > 10) {
    recommendations.push('Monitor weather throughout the day');
    confidence -= 10;
  }

  // Wind
  if (forecast.windSpeed > WORK_CONDITIONS.maxWindSpeed) {
    reasons.push('High winds may cause overspray');
    recommendations.push('Consider windbreaks or rescheduling');
    confidence -= 15;
  }

  return {
    canWork: reasons.length === 0,
    confidence: Math.max(0, confidence),
    reasons,
    recommendations: recommendations.length > 0 
      ? recommendations 
      : ['Conditions are favorable for work'],
  };
}

// ============================================================================
// CACHE WEATHER DATA
// ============================================================================

export async function cacheWeatherData(
  orgId: string,
  lat: number,
  lon: number,
  forecast: WeatherForecast[]
): Promise<void> {
  const { error } = await supabase.from('weather_cache').upsert(
    forecast.map((f) => ({
      org_id: orgId,
      latitude: lat,
      longitude: lon,
      forecast_date: f.date,
      temperature: f.temp,
      humidity: f.humidity,
      precipitation_chance: f.precipitation,
      conditions: f.conditions,
      wind_speed: f.windSpeed,
      work_suitable: f.workSuitable,
      work_notes: f.workReason,
      fetched_at: new Date().toISOString(),
    })),
    { onConflict: 'org_id,forecast_date,latitude,longitude' }
  );

  if (error) {
    console.error('Failed to cache weather data:', error);
  }
}

// ============================================================================
// GET CACHED WEATHER
// ============================================================================

export async function getCachedWeather(
  orgId: string,
  lat: number,
  lon: number
): Promise<WeatherForecast[] | null> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('weather_cache')
    .select('*')
    .eq('org_id', orgId)
    .eq('latitude', lat)
    .eq('longitude', lon)
    .gte('fetched_at', oneHourAgo)
    .gte('forecast_date', new Date().toISOString().split('T')[0])
    .order('forecast_date');

  if (error || !data || data.length === 0) {
    return null;
  }

  return data.map((d) => ({
    date: d.forecast_date,
    temp: d.temperature,
    tempMin: d.temperature - 5,
    tempMax: d.temperature + 5,
    humidity: d.humidity,
    precipitation: d.precipitation_chance,
    conditions: d.conditions,
    icon: '01d',
    windSpeed: d.wind_speed,
    workSuitable: d.work_suitable,
    workReason: d.work_notes,
  }));
}

// ============================================================================
// MOCK DATA (Fallback)
// ============================================================================

function getMockForecast(days: number): WeatherForecast[] {
  const forecast: WeatherForecast[] = [];
  const conditions = ['Clear', 'Clouds', 'Clear', 'Rain', 'Clear', 'Clouds', 'Clear'];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const temp = 65 + Math.random() * 20;
    const humidity = 50 + Math.random() * 30;
    const precipitation = Math.random() * 40;
    const condition = conditions[i % conditions.length];

    const dayForecast: WeatherForecast = {
      date: date.toISOString().split('T')[0],
      temp: Math.round(temp),
      tempMin: Math.round(temp - 5),
      tempMax: Math.round(temp + 8),
      humidity: Math.round(humidity),
      precipitation: Math.round(precipitation),
      conditions: condition,
      icon: condition === 'Rain' ? '10d' : condition === 'Clouds' ? '03d' : '01d',
      windSpeed: Math.round(5 + Math.random() * 10),
      workSuitable: false,
    };

    const assessment = assessWorkability(dayForecast);
    forecast.push({ ...dayForecast, ...assessment });
  }

  return forecast;
}

// ============================================================================
// FIND BEST WORK DAYS
// ============================================================================

export function findBestWorkDays(
  forecast: WeatherForecast[],
  requiredDays: number = 1
): WeatherForecast[] {
  // Sort by suitability (suitable first, then by conditions)
  const sorted = [...forecast].sort((a, b) => {
    if (a.workSuitable && !b.workSuitable) return -1;
    if (!a.workSuitable && b.workSuitable) return 1;
    
    // Both suitable or both not - sort by precipitation
    return a.precipitation - b.precipitation;
  });

  return sorted.slice(0, requiredDays);
}

export default {
  getWeatherForecast,
  assessWorkability,
  getDetailedAssessment,
  cacheWeatherData,
  getCachedWeather,
  findBestWorkDays,
};

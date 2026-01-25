/**
 * Weather Hooks
 * React Query hooks for weather data
 */

import { useQuery } from '@tanstack/react-query';
import * as weatherService from '@/lib/weather';

// Get weather forecast
export function useWeatherForecast(lat: number, lon: number, days?: number) {
  return useQuery({
    queryKey: ['weather', lat, lon, days],
    queryFn: () => weatherService.getWeatherForecast(lat, lon, days),
    enabled: !!lat && !!lon,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Find best work days
export function useBestWorkDays(lat: number, lon: number, requiredDays?: number) {
  const { data: forecast } = useWeatherForecast(lat, lon);

  return {
    bestDays: forecast ? weatherService.findBestWorkDays(forecast, requiredDays) : [],
    isLoading: !forecast,
  };
}

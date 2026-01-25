/**
 * Weather Page
 * Weather forecasting for job planning
 */

import { useState } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Droplets, Thermometer, AlertTriangle, Check, X, MapPin, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ForecastDay {
  date: string;
  dayName: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  conditions: 'clear' | 'cloudy' | 'rain' | 'snow';
  workSuitable: boolean;
  workReason?: string;
}

const mockForecast: ForecastDay[] = [
  { date: '2024-01-22', dayName: 'Monday', temp: 65, tempMin: 52, tempMax: 68, humidity: 45, precipitation: 0, windSpeed: 8, conditions: 'clear', workSuitable: true },
  { date: '2024-01-23', dayName: 'Tuesday', temp: 58, tempMin: 48, tempMax: 62, humidity: 55, precipitation: 10, windSpeed: 12, conditions: 'cloudy', workSuitable: true },
  { date: '2024-01-24', dayName: 'Wednesday', temp: 62, tempMin: 50, tempMax: 66, humidity: 40, precipitation: 0, windSpeed: 6, conditions: 'clear', workSuitable: true },
  { date: '2024-01-25', dayName: 'Thursday', temp: 45, tempMin: 38, tempMax: 48, humidity: 85, precipitation: 80, windSpeed: 15, conditions: 'rain', workSuitable: false, workReason: 'Rain likely (80% chance)' },
  { date: '2024-01-26', dayName: 'Friday', temp: 52, tempMin: 42, tempMax: 56, humidity: 65, precipitation: 20, windSpeed: 10, conditions: 'cloudy', workSuitable: true },
  { date: '2024-01-27', dayName: 'Saturday', temp: 68, tempMin: 55, tempMax: 72, humidity: 35, precipitation: 0, windSpeed: 5, conditions: 'clear', workSuitable: true },
  { date: '2024-01-28', dayName: 'Sunday', temp: 70, tempMin: 58, tempMax: 75, humidity: 30, precipitation: 0, windSpeed: 4, conditions: 'clear', workSuitable: true },
];

const WORK_CONDITIONS = {
  minTemp: 50,
  maxTemp: 95,
  maxHumidity: 85,
  maxPrecipitation: 30,
  maxWindSpeed: 20,
};

const WeatherIcon = ({ conditions, size = 'md' }: { conditions: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-16 w-16' };
  const iconClass = sizeClasses[size];
  
  switch (conditions) {
    case 'clear': return <Sun className={`${iconClass} text-yellow-500`} />;
    case 'cloudy': return <Cloud className={`${iconClass} text-gray-400`} />;
    case 'rain': return <CloudRain className={`${iconClass} text-blue-500`} />;
    case 'snow': return <CloudSnow className={`${iconClass} text-blue-300`} />;
    default: return <Sun className={`${iconClass} text-yellow-500`} />;
  }
};

export default function Weather() {
  const [location, setLocation] = useState('Toledo, OH');
  const [selectedDay, setSelectedDay] = useState<ForecastDay>(mockForecast[0]);

  const workableDays = mockForecast.filter(d => d.workSuitable).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Weather Forecast</h1>
          <p className="text-gray-500">Plan jobs based on weather conditions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <Input value={location} onChange={(e) => setLocation(e.target.value)} className="w-48" placeholder="Enter location" />
          </div>
          <Button variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{workableDays}</p>
              <p className="text-sm text-gray-500">Workable Days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{7 - workableDays}</p>
              <p className="text-sm text-gray-500">Non-workable</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Thermometer className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(mockForecast.reduce((sum, d) => sum + d.temp, 0) / mockForecast.length)}°F</p>
              <p className="text-sm text-gray-500">Avg Temperature</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Droplets className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(mockForecast.reduce((sum, d) => sum + d.humidity, 0) / mockForecast.length)}%</p>
              <p className="text-sm text-gray-500">Avg Humidity</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Forecast */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>7-Day Forecast</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {mockForecast.map((day) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDay(day)}
                    className={`p-3 rounded-lg text-center transition-all ${
                      selectedDay.date === day.date
                        ? 'bg-brand-red text-white'
                        : day.workSuitable
                        ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'
                        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200'
                    }`}
                  >
                    <p className={`text-xs font-medium ${selectedDay.date === day.date ? 'text-white/80' : 'text-gray-500'}`}>
                      {day.dayName.slice(0, 3)}
                    </p>
                    <div className="my-2 flex justify-center">
                      <WeatherIcon conditions={day.conditions} size="md" />
                    </div>
                    <p className={`text-lg font-bold ${selectedDay.date === day.date ? '' : ''}`}>{day.temp}°</p>
                    <p className={`text-xs ${selectedDay.date === day.date ? 'text-white/80' : 'text-gray-500'}`}>
                      {day.tempMin}° / {day.tempMax}°
                    </p>
                    {!day.workSuitable && selectedDay.date !== day.date && (
                      <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{selectedDay.dayName}, {new Date(selectedDay.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-6">
                <WeatherIcon conditions={selectedDay.conditions} size="lg" />
                <div>
                  <p className="text-5xl font-bold">{selectedDay.temp}°F</p>
                  <p className="text-gray-500 capitalize">{selectedDay.conditions}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Thermometer className="h-4 w-4" />
                    <span className="text-sm">High/Low</span>
                  </div>
                  <p className="text-lg font-bold">{selectedDay.tempMax}° / {selectedDay.tempMin}°</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Droplets className="h-4 w-4" />
                    <span className="text-sm">Humidity</span>
                  </div>
                  <p className="text-lg font-bold">{selectedDay.humidity}%</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <CloudRain className="h-4 w-4" />
                    <span className="text-sm">Precipitation</span>
                  </div>
                  <p className="text-lg font-bold">{selectedDay.precipitation}%</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Wind className="h-4 w-4" />
                    <span className="text-sm">Wind</span>
                  </div>
                  <p className="text-lg font-bold">{selectedDay.windSpeed} mph</p>
                </div>
              </div>

              {/* Work Assessment */}
              <div className={`mt-6 p-4 rounded-lg ${selectedDay.workSuitable ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                <div className="flex items-center gap-3">
                  {selectedDay.workSuitable ? (
                    <Check className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  )}
                  <div>
                    <p className={`font-semibold ${selectedDay.workSuitable ? 'text-green-700' : 'text-amber-700'}`}>
                      {selectedDay.workSuitable ? 'Suitable for Work' : 'Not Recommended for Work'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedDay.workSuitable
                        ? 'Conditions are favorable for sealcoating operations.'
                        : selectedDay.workReason || 'Weather conditions not suitable for outdoor work.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ideal Conditions */}
        <div>
          <Card>
            <CardHeader><CardTitle>Ideal Work Conditions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 mb-1">Temperature</p>
                <p className="font-semibold">{WORK_CONDITIONS.minTemp}°F - {WORK_CONDITIONS.maxTemp}°F</p>
                <p className="text-xs text-gray-500 mt-1">Sealcoat requires warm temperatures to cure properly</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 mb-1">Humidity</p>
                <p className="font-semibold">Below {WORK_CONDITIONS.maxHumidity}%</p>
                <p className="text-xs text-gray-500 mt-1">High humidity delays drying time</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 mb-1">Precipitation</p>
                <p className="font-semibold">Below {WORK_CONDITIONS.maxPrecipitation}% chance</p>
                <p className="text-xs text-gray-500 mt-1">Rain can damage fresh sealcoat</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 mb-1">Wind Speed</p>
                <p className="font-semibold">Below {WORK_CONDITIONS.maxWindSpeed} mph</p>
                <p className="text-xs text-gray-500 mt-1">High winds cause overspray issues</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader><CardTitle>Best Days This Week</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mockForecast.filter(d => d.workSuitable).slice(0, 3).map(day => (
                <div key={day.date} className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2">
                    <WeatherIcon conditions={day.conditions} size="sm" />
                    <span className="font-medium">{day.dayName}</span>
                  </div>
                  <span className="text-sm text-gray-500">{day.temp}°F</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

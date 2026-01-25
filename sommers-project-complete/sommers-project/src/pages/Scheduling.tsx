/**
 * Scheduling Page
 * Calendar view for job scheduling
 */

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Clock, Users, Sun, Cloud, CloudRain, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, cn } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  client: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  crew: string;
  crewColor: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'weather_hold';
  value: number;
}

interface WeatherDay {
  date: string;
  temp: number;
  conditions: 'clear' | 'cloudy' | 'rain';
  workSuitable: boolean;
}

const mockJobs: Job[] = [
  { id: '1', title: 'Westside Shopping Center', client: 'ABC Corp', address: '123 Main St', date: '2024-01-22', startTime: '07:00', endTime: '15:00', crew: 'Crew A', crewColor: '#3B82F6', status: 'scheduled', value: 15000 },
  { id: '2', title: 'Oak Ridge HOA', client: 'Oak Ridge', address: '456 Oak Ave', date: '2024-01-22', startTime: '08:00', endTime: '12:00', crew: 'Crew B', crewColor: '#22C55E', status: 'scheduled', value: 8500 },
  { id: '3', title: 'Industrial Park Lot', client: 'Industrial LLC', address: '789 Industrial Blvd', date: '2024-01-23', startTime: '06:00', endTime: '16:00', crew: 'Crew A', crewColor: '#3B82F6', status: 'scheduled', value: 32000 },
  { id: '4', title: 'Church Parking', client: 'First Baptist', address: '321 Church St', date: '2024-01-24', startTime: '07:00', endTime: '14:00', crew: 'Crew C', crewColor: '#F59E0B', status: 'scheduled', value: 12000 },
  { id: '5', title: 'School District', client: 'Springfield Schools', address: '555 School Rd', date: '2024-01-25', startTime: '06:00', endTime: '18:00', crew: 'Crew A', crewColor: '#3B82F6', status: 'scheduled', value: 45000 },
];

const mockWeather: WeatherDay[] = [
  { date: '2024-01-22', temp: 65, conditions: 'clear', workSuitable: true },
  { date: '2024-01-23', temp: 58, conditions: 'cloudy', workSuitable: true },
  { date: '2024-01-24', temp: 62, conditions: 'clear', workSuitable: true },
  { date: '2024-01-25', temp: 45, conditions: 'rain', workSuitable: false },
  { date: '2024-01-26', temp: 52, conditions: 'cloudy', workSuitable: true },
  { date: '2024-01-27', temp: 68, conditions: 'clear', workSuitable: true },
  { date: '2024-01-28', temp: 70, conditions: 'clear', workSuitable: true },
];

const WeatherIcon = ({ conditions }: { conditions: string }) => {
  switch (conditions) {
    case 'clear': return <Sun className="h-5 w-5 text-yellow-500" />;
    case 'cloudy': return <Cloud className="h-5 w-5 text-gray-400" />;
    case 'rain': return <CloudRain className="h-5 w-5 text-blue-500" />;
    default: return <Sun className="h-5 w-5 text-yellow-500" />;
  }
};

export default function Scheduling() {
  const [currentDate, setCurrentDate] = useState(new Date('2024-01-22'));
  const [view, setView] = useState<'week' | 'month'>('week');

  // Generate week days
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getJobsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mockJobs.filter(job => job.date === dateStr);
  };

  const getWeatherForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mockWeather.find(w => w.date === dateStr);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const crews = [
    { name: 'Crew A', color: '#3B82F6', lead: 'Mike Johnson', members: 4 },
    { name: 'Crew B', color: '#22C55E', lead: 'Sarah Williams', members: 3 },
    { name: 'Crew C', color: '#F59E0B', lead: 'Tom Brown', members: 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Scheduling</h1>
          <p className="text-gray-500">Manage jobs and crew assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button onClick={() => setView('week')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'week' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Week</button>
            <button onClick={() => setView('month')} className={`px-3 py-1.5 text-sm rounded-md ${view === 'month' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Month</button>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />}>Schedule Job</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigateWeek(-1)}><ChevronLeft className="h-5 w-5" /></Button>
                <h2 className="text-lg font-semibold">
                  {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => navigateWeek(1)}><ChevronRight className="h-5 w-5" /></Button>
              </div>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
            </CardHeader>
            <CardContent>
              {/* Week Grid */}
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const jobs = getJobsForDate(day);
                  const weather = getWeatherForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div key={index} className={`min-h-[200px] border rounded-lg ${isToday ? 'border-brand-red' : 'border-gray-200 dark:border-gray-700'}`}>
                      {/* Day Header */}
                      <div className={`p-2 border-b ${isToday ? 'bg-brand-red/10' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">{dayNames[index]}</p>
                            <p className={`text-lg font-bold ${isToday ? 'text-brand-red' : ''}`}>{day.getDate()}</p>
                          </div>
                          {weather && (
                            <div className="flex items-center gap-1">
                              <WeatherIcon conditions={weather.conditions} />
                              <span className="text-xs">{weather.temp}°</span>
                              {!weather.workSuitable && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Jobs */}
                      <div className="p-1 space-y-1">
                        {jobs.map(job => (
                          <div
                            key={job.id}
                            className="p-2 rounded text-xs cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: `${job.crewColor}20`, borderLeft: `3px solid ${job.crewColor}` }}
                          >
                            <p className="font-medium truncate">{job.title}</p>
                            <p className="text-gray-500">{job.startTime} - {job.endTime}</p>
                            <p className="text-gray-500">{job.crew}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Crews */}
          <Card>
            <CardHeader><CardTitle>Crews</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {crews.map(crew => (
                <div key={crew.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: crew.color }} />
                    <div>
                      <p className="font-medium text-sm">{crew.name}</p>
                      <p className="text-xs text-gray-500">{crew.lead}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="h-3 w-3" />{crew.members}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weather Forecast */}
          <Card>
            <CardHeader><CardTitle>7-Day Forecast</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mockWeather.map(day => (
                <div key={day.date} className={`flex items-center justify-between p-2 rounded-lg ${!day.workSuitable ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                  <div className="flex items-center gap-2">
                    <WeatherIcon conditions={day.conditions} />
                    <span className="text-sm">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{day.temp}°F</span>
                    {!day.workSuitable && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Jobs */}
          <Card>
            <CardHeader><CardTitle>Upcoming Jobs</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mockJobs.slice(0, 3).map(job => (
                <div key={job.id} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-sm">{job.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <CalendarIcon className="h-3 w-3" />
                    {new Date(job.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {job.address}
                  </div>
                  <p className="text-sm font-bold text-brand-red mt-1">{formatCurrency(job.value)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

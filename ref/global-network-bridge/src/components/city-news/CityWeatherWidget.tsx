import { ThermometerSun, Wind, Droplets } from "lucide-react";

interface CityWeatherWidgetProps {
  city: string;
  weather: { temp: string; condition: string; humidity: string; wind: string };
}

const CityWeatherWidget = ({ city, weather }: CityWeatherWidgetProps) => (
  <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border border-blue-500/15 rounded-xl px-4 py-2 mb-6">
    <ThermometerSun className="h-5 w-5 text-blue-400 opacity-70 shrink-0" />
    <span className="text-sm font-semibold text-foreground">{city}</span>
    <span className="text-sm font-bold text-foreground">{weather.temp}</span>
    <span className="text-xs text-muted-foreground">{weather.condition}</span>
    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Droplets className="h-3 w-3" />{weather.humidity}</span>
    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Wind className="h-3 w-3" />{weather.wind}</span>
  </div>
);

export default CityWeatherWidget;

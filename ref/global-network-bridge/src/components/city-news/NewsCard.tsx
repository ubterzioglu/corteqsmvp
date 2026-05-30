import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin } from "lucide-react";
import { categoryConfig, type CityNewsItem } from "@/data/cityNewsData";

interface NewsCardProps {
  news: CityNewsItem;
  isInternational?: boolean;
  showCity?: boolean;
}

const NewsCard = ({ news, isInternational, showCity }: NewsCardProps) => {
  const cfg = categoryConfig[news.category];
  const Icon = cfg.icon;

  return (
    <Card className={`bg-card border-border hover:border-primary/30 transition-colors group cursor-pointer overflow-hidden ${
      isInternational ? "border-l-2 border-l-blue-500/40" : ""
    }`}>
      {news.image && (
        <div className="h-40 overflow-hidden">
          <img src={news.image} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline" className="text-xs gap-1">
            <Icon className={`h-3 w-3 ${cfg.color}`} />
            {cfg.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{news.source}</span>
          {isInternational && (
            <Badge variant="secondary" className="text-xs gap-1 bg-blue-500/10 text-blue-400 border-blue-500/20">
              <Globe className="h-3 w-3" />
              Uluslararası
            </Badge>
          )}
          {showCity && (
            <Badge variant="secondary" className="text-xs gap-1">
              <MapPin className="h-3 w-3" />
              {news.city}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
          {news.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground font-body line-clamp-2">{news.summary}</p>
        <p className="text-xs text-muted-foreground/60 mt-3">{news.date}</p>
      </CardContent>
    </Card>
  );
};

export default NewsCard;

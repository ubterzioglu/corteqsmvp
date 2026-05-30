import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { events } from "@/data/mock";

const categoryColors: Record<string, string> = {
  networking: "bg-turquoise/10 text-turquoise",
  eğitim: "bg-primary/10 text-primary",
  kültür: "bg-purple-500/10 text-purple-600",
  iş: "bg-gold/10 text-gold",
  sosyal: "bg-pink-500/10 text-pink-600",
  spor: "bg-success/10 text-success",
};

const categoryLabels: Record<string, string> = {
  networking: "Networking",
  eğitim: "Eğitim",
  kültür: "Kültür",
  iş: "İş & Kariyer",
  sosyal: "Sosyal",
  spor: "Spor",
};

const featuredEvents = events.filter((e) => e.featured);

const FeaturedEvents = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Öne Çıkan <span className="text-gradient-primary">Etkinlikler</span>
            </h2>
            <p className="text-muted-foreground font-body mt-2">
              Diasporadaki en popüler etkinlikleri keşfedin
            </p>
          </div>
          <Link to="/events">
            <Button variant="outline" className="gap-1 hidden sm:flex">
              Tümünü Gör <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Carousel opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]} className="w-full">
          <CarouselContent className="-ml-4">
            {featuredEvents.map((event) => (
              <CarouselItem key={event.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <Link to={`/event/${event.id}`} className="block group">
                  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className="bg-gold/90 text-white border-0 text-xs">⭐ Öne Çıkan</Badge>
                        <Badge className={`border-0 text-xs ${categoryColors[event.category]}`}>
                          {categoryLabels[event.category]}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white/80 text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {event.date} • {event.time}
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-foreground text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-muted-foreground text-sm font-body line-clamp-2 mb-4">
                        {event.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {event.city}, {event.country}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" /> {event.attendees}/{event.maxAttendees}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                        <span className={`font-bold ${event.price === 0 ? "text-success" : "text-foreground"}`}>
                          {event.price === 0 ? "Ücretsiz" : `€${event.price}`}
                        </span>
                        <span className="text-primary text-sm font-semibold group-hover:underline">
                          Detay →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-4 bg-card border-border" />
          <CarouselNext className="-right-4 bg-card border-border" />
        </Carousel>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/events">
            <Button variant="outline" className="gap-1">
              Tümünü Gör <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;

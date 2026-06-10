import type { PublicSectionRendererProps } from "./renderer-registry";

type ServiceEntry = { name: string; description: string | null };

const isServiceEntry = (entry: unknown): entry is ServiceEntry =>
  typeof entry === "object" && entry !== null && typeof (entry as ServiceEntry).name === "string";

const ServicesSection = ({ section }: PublicSectionRendererProps) => {
  const services = Array.isArray(section.content.services)
    ? section.content.services.filter(isServiceEntry)
    : [];
  if (services.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {services.map((service) => (
        <div
          key={service.name}
          className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3"
        >
          <p className="text-sm font-semibold text-foreground">{service.name}</p>
          {service.description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{service.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default ServicesSection;

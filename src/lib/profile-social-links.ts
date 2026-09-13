import type { ComponentType } from "react";
import { Facebook, Instagram, MessageCircle, Music2, Twitter, Youtube } from "lucide-react";

export type SocialAttributeConfig = {
  key: string;
  label: string;
  placeholder: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
};

export const SOCIAL_ATTRIBUTE_CONFIGS: SocialAttributeConfig[] = [
  {
    key: "instagram_url",
    label: "Instagram",
    placeholder: "@kullanıcıadı veya tam URL",
    icon: Instagram,
    iconClassName: "text-pink-500",
  },
  {
    key: "facebook_url",
    label: "Facebook",
    placeholder: "Sayfa URL'si",
    icon: Facebook,
    iconClassName: "text-blue-600",
  },
  {
    key: "youtube_url",
    label: "YouTube",
    placeholder: "@kanal veya URL",
    icon: Youtube,
    iconClassName: "text-red-600",
  },
  {
    key: "tiktok_url",
    label: "TikTok",
    placeholder: "@kullanıcıadı",
    icon: Music2,
    iconClassName: "text-foreground",
  },
  {
    key: "x_url",
    label: "X (Twitter)",
    placeholder: "@kullanıcıadı",
    icon: Twitter,
    iconClassName: "text-foreground",
  },
  {
    key: "reddit_url",
    label: "Reddit",
    placeholder: "u/kullanıcıadı veya URL",
    icon: MessageCircle,
    iconClassName: "text-orange-500",
  },
] as const;

export const SOCIAL_ATTRIBUTE_KEYS: Set<string> = new Set(
  SOCIAL_ATTRIBUTE_CONFIGS.map((config) => config.key),
);

export const ensureHttpsUrl = (value: string): string =>
  value.match(/^https?:\/\//i) ? value : `https://${value}`;

/**
 * Kullanıcının yazdığı kısa formu (@kullanıcıadı, u/kullanıcı, çıplak alan adı)
 * tam URL'e çevirir. Zaten http(s) ile başlayan değer olduğu gibi bırakılır.
 */
export const normalizeSocialMediaValue = (attributeKey: string, rawValue: string): string => {
  const value = rawValue.trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  switch (attributeKey) {
    case "instagram_url": {
      if (/instagram\.com/i.test(value)) return ensureHttpsUrl(value);
      return `https://www.instagram.com/${value.replace(/^@+/, "")}`;
    }
    case "facebook_url": {
      if (/facebook\.com/i.test(value)) return ensureHttpsUrl(value);
      return `https://www.facebook.com/${value.replace(/^@+/, "")}`;
    }
    case "linkedin_url": {
      if (/linkedin\.com/i.test(value)) return ensureHttpsUrl(value);
      return `https://www.linkedin.com/in/${value.replace(/^@+/, "")}`;
    }
    case "youtube_url": {
      if (/youtube\.com|youtu\.be/i.test(value)) return ensureHttpsUrl(value);
      const cleaned = value.replace(/^@+/, "");
      return `https://www.youtube.com/@${cleaned}`;
    }
    case "tiktok_url": {
      if (/tiktok\.com/i.test(value)) return ensureHttpsUrl(value);
      return `https://www.tiktok.com/@${value.replace(/^@+/, "")}`;
    }
    case "x_url": {
      if (/x\.com|twitter\.com/i.test(value)) return ensureHttpsUrl(value);
      return `https://x.com/${value.replace(/^@+/, "")}`;
    }
    case "reddit_url": {
      if (/reddit\.com/i.test(value)) return ensureHttpsUrl(value);
      const cleaned = value.replace(/^\/+/, "");
      if (/^(u|r)\//i.test(cleaned)) {
        return `https://www.reddit.com/${cleaned}`;
      }
      return `https://www.reddit.com/u/${cleaned.replace(/^@+/, "")}`;
    }
    default:
      return value;
  }
};

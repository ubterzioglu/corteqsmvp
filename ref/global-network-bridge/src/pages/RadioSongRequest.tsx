import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Radio, Music, Gift, Phone, Mic, Clock, CreditCard, Play,
  ArrowLeft, Check, Send, Heart, User, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { associations } from "@/data/mock";
import { useToast } from "@/hooks/use-toast";

const mockPrograms = [
  {
    id: "sabah-show",
    name: "Sabah Şov",
    host: "Ahmet Bey",
    schedule: "Pzt-Cum 08:00-10:00",
    acceptsRequests: true,
    songRequestPrice: 5,
    giftPrice: 15,
    description: "Enerjik müzikle güne başlayın! İstek parça ve selamlar.",
    liveNow: true,
  },
  {
    id: "aksam-melodileri",
    name: "Akşam Melodileri",
    host: "Fatma Hanım",
    schedule: "Her gün 18:00-20:00",
    acceptsRequests: true,
    songRequestPrice: 5,
    giftPrice: 15,
    description: "Nostaljik Türk müziği ve dinleyici istekleri.",
    liveNow: false,
  },
  {
    id: "gece-fiskos",
    name: "Gece Fısıltısı",
    host: "Emre Bey",
    schedule: "Cmt-Paz 22:00-00:00",
    acceptsRequests: true,
    songRequestPrice: 7,
    giftPrice: 20,
    description: "Romantik şarkılar ve özel dedikasyonlar. Sevdiklerinize şarkı hediye edin.",
    liveNow: false,
  },
  {
    id: "turku-zamani",
    name: "Türkü Zamanı",
    host: "Ayşe Hanım",
    schedule: "Pzt-Cum 14:00-16:00",
    acceptsRequests: true,
    songRequestPrice: 5,
    giftPrice: 12,
    description: "Anadolu'nun en güzel türküleri ve halk müziği.",
    liveNow: false,
  },
];

const RadioSongRequest = () => {
  const { id } = useParams<{ id: string }>();
  const radio = associations.find((a) => a.id === id && a.type === "Radyo");
  const { toast } = useToast();

  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [isGift, setIsGift] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);

  const [formData, setFormData] = useState({
    songName: "",
    artistName: "",
    message: "",
    senderName: "",
    recipientName: "",
    recipientPhone: "",
    giftMessage: "",
  });

  if (!radio) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center py-20">
          <h1 className="text-2xl font-bold text-foreground mb-4">Radyo bulunamadı</h1>
          <Link to="/associations" className="text-primary hover:underline">← Kuruluşlara dön</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const program = mockPrograms.find((p) => p.id === selectedProgram);
  const totalPrice = program
    ? (isGift ? program.giftPrice : program.songRequestPrice) + (hasRecording ? 5 : 0)
    : 0;

  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasRecording(true);
      toast({ title: "Ses kaydı tamamlandı 🎙️", description: "Kaydınız başarıyla oluşturuldu." });
    } else {
      setIsRecording(true);
      setHasRecording(false);
      // Simulate recording for 3 seconds
      setTimeout(() => {
        setIsRecording(false);
        setHasRecording(true);
        toast({ title: "Ses kaydı tamamlandı 🎙️", description: "3 saniyelik örnek kayıt oluşturuldu." });
      }, 3000);
    }
  };

  const handleSubmit = () => {
    toast({
      title: isGift ? "Hediye gönderildi! 🎁" : "İstek parça gönderildi! 🎵",
      description: isGift
        ? `${formData.recipientName} adına hediye parçanız ${program?.name} programında çalınacak. SMS bildirimi gönderilecek.`
        : `"${formData.songName}" isteğiniz ${program?.name} programına iletildi.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to={`/association/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> {radio.name}'a dön
          </Link>

          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500/10 to-primary/10 rounded-2xl p-6 md:p-8 border border-purple-500/20 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Radio className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{radio.name}</h1>
                <p className="text-muted-foreground font-body flex items-center gap-2">
                  <Music className="h-4 w-4" /> İstek Parça & Hediye Şarkı
                </p>
              </div>
            </div>
            <p className="text-muted-foreground font-body">
              Sevdiğiniz şarkıyı radyoda çaldırın veya birine hediye edin! Hediye edilen kişiye SMS ile bildirim gönderilir.
            </p>
          </div>

          {/* Step 1: Select Program */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">1</span>
              Program Seçin
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockPrograms.map((prog) => (
                <button
                  key={prog.id}
                  onClick={() => setSelectedProgram(prog.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedProgram === prog.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-foreground">{prog.name}</h3>
                    <div className="flex items-center gap-2">
                      {prog.liveNow && (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" /> Canlı
                        </Badge>
                      )}
                      {selectedProgram === prog.id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">🎙️ {prog.host}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {prog.schedule}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">{prog.description}</p>
                  <div className="flex gap-3 mt-3 text-xs">
                    <span className="text-primary font-semibold">İstek: €{prog.songRequestPrice}</span>
                    <span className="text-gold font-semibold">Hediye: €{prog.giftPrice}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Song & Details */}
          {selectedProgram && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">2</span>
                Şarkı & Detaylar
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label>Şarkı Adı *</Label>
                  <Input
                    placeholder="ör. Seni Seviyorum"
                    value={formData.songName}
                    onChange={(e) => setFormData({ ...formData, songName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Sanatçı</Label>
                  <Input
                    placeholder="ör. Tarkan"
                    value={formData.artistName}
                    onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Gönderen İsim *</Label>
                  <Input
                    placeholder="Adınız"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Selamlama Mesajı</Label>
                  <Input
                    placeholder="ör. Tüm Berlin'deki Türklere sevgilerle..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
              </div>

              {/* Gift Toggle */}
              <div className="bg-gold/5 border border-gold/20 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-gold" />
                    <div>
                      <p className="font-bold text-foreground">🎁 Birine Hediye Et</p>
                      <p className="text-xs text-muted-foreground">Sevdiğiniz birine sürpriz şarkı hediye edin</p>
                    </div>
                  </div>
                  <Switch checked={isGift} onCheckedChange={setIsGift} />
                </div>

                {isGift && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-gold/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Hediye Edilen Kişi *</Label>
                        <Input
                          placeholder="Kişinin adı"
                          value={formData.recipientName}
                          onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Telefon Numarası *
                        </Label>
                        <Input
                          placeholder="+49 xxx xxxx xxx"
                          value={formData.recipientPhone}
                          onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          SMS ile radyo linki, yayın saati ve hediye bildirimi gönderilecek
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label>Hediye Mesajı</Label>
                      <Textarea
                        placeholder="ör. Doğum günün kutlu olsun! Bu şarkı sana gelsin..."
                        value={formData.giftMessage}
                        onChange={(e) => setFormData({ ...formData, giftMessage: e.target.value })}
                        rows={3}
                      />
                    </div>

                    {/* Voice Recording */}
                    <div className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                            <Mic className="h-4 w-4 text-primary" /> Ses Kaydı Ekle (+€5)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sesinizi kaydedin, radyo hediye şarkıdan önce kaydınızı yayınlasın
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant={isRecording ? "destructive" : hasRecording ? "secondary" : "outline"}
                          size="sm"
                          onClick={handleRecordToggle}
                          className="gap-2"
                        >
                          {isRecording ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                              Kaydediliyor...
                            </>
                          ) : hasRecording ? (
                            <>
                              <Mic className="h-4 w-4" /> Tekrar Kaydet
                            </>
                          ) : (
                            <>
                              <Mic className="h-4 w-4" /> Kayda Başla
                            </>
                          )}
                        </Button>

                        {hasRecording && (
                          <div className="flex items-center gap-2 text-sm text-turquoise">
                            <Check className="h-4 w-4" />
                            <span className="font-medium">Ses kaydı hazır (0:03)</span>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Play className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Summary & Payment */}
          {selectedProgram && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">3</span>
                Ödeme & Gönder
              </h2>

              {/* What recipient gets */}
              {isGift && (
                <div className="bg-muted/50 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-foreground text-sm mb-2">📱 Alıcıya gönderilecek SMS:</h3>
                  <div className="bg-card rounded-lg p-3 border border-border text-sm text-muted-foreground font-body">
                    <p>🎁 <strong>{formData.senderName || "Birisi"}</strong> size "{formData.songName || "bir şarkı"}" hediye etti!</p>
                    <p className="mt-1">📻 {radio.name} - {program?.name}</p>
                    <p>🕐 Yayın: {program?.schedule}</p>
                    <p>🔗 Dinle: {radio.website}</p>
                    {formData.giftMessage && <p className="mt-1 italic">💬 "{formData.giftMessage}"</p>}
                    {hasRecording && <p className="mt-1">🎙️ Size özel bir ses mesajı da var!</p>}
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isGift ? "Hediye Şarkı" : "İstek Parça"} — {program?.name}
                  </span>
                  <span className="text-foreground font-medium">€{isGift ? program?.giftPrice : program?.songRequestPrice}</span>
                </div>
                {hasRecording && isGift && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ses Kaydı Eklentisi</span>
                    <span className="text-foreground font-medium">€5</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-bold text-foreground">Toplam</span>
                  <span className="font-bold text-primary text-lg">€{totalPrice}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Link to={`/association/${id}`} className="flex-1">
                  <Button variant="outline" className="w-full">İptal</Button>
                </Link>
                <Button onClick={handleSubmit} className="flex-1 gap-2">
                  <CreditCard className="h-4 w-4" />
                  €{totalPrice} Öde & Gönder
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RadioSongRequest;

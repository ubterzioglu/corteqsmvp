import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { messages, surveyData } = await req.json();

    const systemPrompt = `Sen Corteqs Relocation Engine'in AI asistanısın. Türk diasporasına yurt dışına taşınma konusunda yardımcı oluyorsun.

Kullanıcı profili:
- Hedef ülke: ${surveyData?.targetCountry || "Belirtilmedi"}
- Hedef şehir: ${surveyData?.targetCity || "Belirtilmedi"}
- Aile durumu: ${surveyData?.familyStatus === "single" ? "Yalnız" : surveyData?.familyStatus === "couple" ? "Çift" : "Aile"}
- Meslek: ${surveyData?.profession || "Belirtilmedi"}
${surveyData?.familyStatus === "family" ? `- Çocuk sayısı: ${surveyData?.childrenCount}, Yaşları: ${surveyData?.childrenAges}` : ""}
${surveyData?.spouseWorking === "yes" ? "- Eş de çalışacak" : ""}
- Şu anki ülke: ${surveyData?.currentCountry || "Türkiye"}

Görevin:
1. Hedef ülkedeki yaşam masrafları, kira, maaşlar hakkında güncel ve doğru bilgi ver
2. Vize/oturma izni süreçleri hakkında rehberlik et
3. Mesleğiyle ilgili iş fırsatları ve denklik süreçleri hakkında bilgi ver
4. Çocuklu ailelere okul seçenekleri sun
5. Taşınma checklist'i ve bütçe planlaması konusunda yardımcı ol
6. Yanıtlarını Türkçe ver, kısa ve öz tut
7. Markdown formatı kullan (başlıklar, listeler, kalın yazı)
8. Her yanıtta emoji kullan, samimi ve yardımsever ol

ÖNEMLİ: Kullanıcının mesleğine ve aile durumuna göre kişiselleştirilmiş öneriler ver.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Çok fazla istek gönderildi, lütfen biraz bekleyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kredi yetersiz. Lütfen Lovable workspace'inize kredi ekleyin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI servisi şu an kullanılamıyor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("relocation-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

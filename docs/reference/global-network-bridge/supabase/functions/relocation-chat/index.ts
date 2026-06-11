import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_MODEL = "gemini-flash-latest";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

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

    const contents = (messages as ChatMessage[]).map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
      },
    };

    let response: Response | null = null;
    let lastErrorText = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) break;

      lastErrorText = await response.text();
      if (![429, 503].includes(response.status) || attempt === 2) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }

    if (!response) {
      throw new Error("Gemini response was not created");
    }

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
      const t = lastErrorText || await response.text();
      console.error("Gemini API error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI servisi şu an kullanılamıyor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") || "";
    const payload = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`;

    return new Response(payload, {
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

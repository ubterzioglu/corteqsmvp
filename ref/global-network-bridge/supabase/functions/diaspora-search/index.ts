import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_MODEL = "gemini-flash-latest";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const { query, country } = await req.json();

    const systemPrompt = `Sen CorteQS platformunun AI arama asistanısın. Türk diasporasına yurt dışındaki hizmetleri bulmalarında yardımcı oluyorsun.

Kullanıcının seçili ülkesi: ${country || "Tüm Ülkeler"}

Görevin:
1. Kullanıcının arama sorgusunu analiz et
2. İlgili sonuçları JSON formatında döndür
3. Her sonuç şu bilgileri içersin: başlık, açıklama, kategori, konum, link önerisi
4. Sonuçları en alakalıdan en az alakalıya sırala
5. Her zaman Türkçe yanıt ver
6. Aşağıdaki kategorilerden uygun olanları kullan: Konsolosluk, Doktor, Vize & Göçmenlik, Türk Marketi, İş İlanları, Danışman, Dernek, İşletme, Etkinlik

MUTLAKA aşağıdaki JSON formatında yanıt ver (başka bir şey yazma):
{
  "results": [
    {
      "title": "Sonuç başlığı",
      "description": "Kısa açıklama",
      "category": "Kategori",
      "location": "Şehir, Ülke",
      "type": "consultant|association|business|event",
      "icon": "🏛️|🩺|✈️|🛒|💼|👤|🏢|📅"
    }
  ]
}

3-6 arası sonuç döndür. Gerçekçi ve faydalı sonuçlar üret.`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: query }],
        },
      ],
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
          JSON.stringify({ error: "Kredi yetersiz." }),
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
    
    // Parse JSON from response
    let results;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      results = jsonMatch ? JSON.parse(jsonMatch[0]) : { results: [] };
    } catch {
      results = { results: [] };
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diaspora-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

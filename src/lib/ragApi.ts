type RagResponse = {
  answer: string;
  hasContext: boolean;
};

export async function askRag(question: string): Promise<RagResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    throw new Error("RAG service unavailable");
  }

  return res.json();
}

const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GUSTAV_INSTRUCTIONS = `
Du spelar Gustav Lindqvist, 20 år, i ett fiktivt SOS 112-samtal.

Svara på svenska och naturligt, som en stressad 20-åring i telefon. Förstå även stavfel, slang, korta frågor och konstig ordföljd. Svara kort, oftast 1–3 meningar.

Hitta aldrig på fakta. Om Gustav inte rimligen kan veta något ska han säga att han inte vet, inte minns eller inte har koll. Han ska inte avslöja mysteriets lösning eller vem som är skyldig.

Gustav vet:
- Han heter Gustav Lindqvist och är 20 år.
- Benjamin Afsharazad är 20 år och Gustavs kompis.
- Totalt är de sex personer i stugan.
- De är ett kompisgäng och kom dit igår.
- Gustav vet inte den exakta adressen och ber SOS använda hans GPS.
- Han står framför Benjamin. Benjamin ligger i sin säng.
- Benjamin reagerar inte och andas inte. Gustav upplever honom som kall.
- Gustav ser inget blod eller någon tydlig skada.
- Gustav vaknade runt 10:00 och märkte efter cirka 20 minuter att Benjamin fortfarande låg helt stilla.
- Gustav såg Benjamin vid liv senast innan de gick och lade sig, ungefär 01:00–02:00.
- Gustav tror att Benjamin är fullt frisk och känner inte till några mediciner.
- De drack glögg, julmust och vatten. Ingen alkohol.
- Gustav vet inte exakt vad Benjamin drack eller vem som hällde upp vilken dryck.
- Gustav vet inte exakt var de andra fem är, men tror att de är i stugan.
- Gustav har inte sett någon lämna.
- Han tror att ytterdörren är låst och att det bara finns en ingång.
- Han gör hjärt-lungräddning när SOS instruerar honom.
- Han är stressad och vill att hjälpen ska komma snabbt.

Om spelaren bara säger hej, okej, vänta, tack eller liknande ska Gustav svara socialt och naturligt. Behåll alltid rollen som Gustav.
`;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY saknas." });

  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-20) : [];
    if (!message) return res.status(400).json({ error: "Meddelande saknas." });

    const input = [
      ...history
        .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ];

    const response = await client.responses.create({
      model: "gpt-6-luna",
      instructions: GUSTAV_INSTRUCTIONS,
      input
    });

    res.status(200).json({
      reply: response.output_text || "Jag vet inte... jag försöker bara hjälpa honom just nu."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI-förfrågan misslyckades." });
  }
};

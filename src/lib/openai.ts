// ChatGPT (OpenAI) – tekst (Responses API) i diktiranje (transkripcija), zvanični SDK iz preglednika.
// Učitava se tek kad zatreba (dinamički import iz ai.ts).

import OpenAI from 'openai';
import { AIGreska, CHATGPT_REZERVNI, TRANSKRIPCIJA_MODELI, type ZahtjevAI } from './ai';

function klijent(kljuc: string) {
  return new OpenAI({ apiKey: kljuc, dangerouslyAllowBrowser: true, maxRetries: 1 });
}

function prevedi(e: unknown): AIGreska {
  if (e instanceof AIGreska) return e;
  if (e instanceof OpenAI.AuthenticationError) return new AIGreska('OpenAI API ključ nije ispravan. Provjeri ga u Postavkama.');
  if (e instanceof OpenAI.PermissionDeniedError) return new AIGreska('OpenAI ključ nema dozvolu za ovaj model. Provjeri račun na platform.openai.com.');
  if (e instanceof OpenAI.RateLimitError) return new AIGreska('ChatGPT: previše zahtjeva ili nema kredita na računu (platform.openai.com → Billing).');
  if (e instanceof OpenAI.APIConnectionError) return new AIGreska('Nema veze sa ChatGPT servisom. Provjeri internet.');
  if (e instanceof OpenAI.APIError) return new AIGreska(`ChatGPT greška (${e.status ?? '?'}): ${e.message}`);
  return new AIGreska('ChatGPT greška: ' + (e as Error).message);
}

const nepostojeciModel = (e: unknown) =>
  e instanceof OpenAI.NotFoundError || (e instanceof OpenAI.BadRequestError && /model/i.test(e.message) && /(exist|found|support|access)/i.test(e.message));

export async function generisiOpenAI(z: ZahtjevAI, kljuc: string, model: string): Promise<string> {
  const c = klijent(kljuc);
  const prvaKorisnicka = z.poruke.findIndex((m) => m.uloga === 'user');
  const input = z.poruke.map((m, i) => {
    if (m.uloga === 'user' && i === prvaKorisnicka && z.dokumenti?.length) {
      return {
        role: 'user' as const,
        content: [
          ...z.dokumenti.map((d) => ({ type: 'input_file' as const, filename: d.naziv, file_data: `data:${d.tip};base64,${d.base64}` })),
          { type: 'input_text' as const, text: m.tekst },
        ],
      };
    }
    return { role: m.uloga, content: m.tekst };
  });

  const modeli = [model, ...CHATGPT_REZERVNI.filter((m) => m !== model)];
  let zadnja: unknown;
  for (const m of modeli) {
    try {
      const r = await c.responses.create({
        model: m,
        instructions: z.sistem,
        input,
        max_output_tokens: z.maxTokens ?? 8000,
      });
      const tekst = (r.output_text ?? '').trim();
      if (!tekst) throw new AIGreska('ChatGPT nije vratio tekst. Pokušaj ponovo.');
      return tekst;
    } catch (e) {
      zadnja = e;
      if (nepostojeciModel(e)) continue; // probaj sljedeći model
      throw prevedi(e);
    }
  }
  throw prevedi(zadnja);
}

export async function transkribujOpenAI(audio: Blob, kljuc: string): Promise<string> {
  const c = klijent(kljuc);
  const ekst = audio.type.includes('mp4') ? 'm4a' : audio.type.includes('ogg') ? 'ogg' : 'webm';
  const fajl = new File([audio], `diktat.${ekst}`, { type: audio.type || 'audio/webm' });
  let zadnja: unknown;
  for (const model of TRANSKRIPCIJA_MODELI) {
    try {
      const r = await c.audio.transcriptions.create({
        file: fajl,
        model,
        language: 'bs',
        prompt: 'Školski psiholog diktira bilješku na bosanskom jeziku (ijekavica). Učenici se navode šiframa poput U056.',
      });
      return (r.text ?? '').trim();
    } catch (e) {
      zadnja = e;
      if (nepostojeciModel(e)) continue;
      throw prevedi(e);
    }
  }
  throw prevedi(zadnja);
}

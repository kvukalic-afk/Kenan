// Snimanje glasa za ChatGPT diktiranje (MediaRecorder).

export const snimanjePodrzano = () =>
  typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

export interface Snimac {
  zaustavi(): Promise<Blob>;
  odustani(): void;
  nivo(): number; // 0..1 jačina zvuka za animaciju
}

export async function pocniSnimanje(): Promise<Snimac> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const tip = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported?.(t)) ?? '';
  const rec = new MediaRecorder(stream, tip ? { mimeType: tip } : undefined);
  const dijelovi: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) dijelovi.push(e.data); };
  rec.start(250);

  // jačina zvuka za animirane trake
  let analizator: AnalyserNode | null = null;
  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioContext();
    analizator = ctx.createAnalyser();
    analizator.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analizator);
  } catch { /* bez animacije */ }
  const buf = new Uint8Array(128);

  const ugasi = () => {
    stream.getTracks().forEach((t) => t.stop());
    void ctx?.close().catch(() => {});
  };

  return {
    nivo() {
      if (!analizator) return 0.3;
      analizator.getByteTimeDomainData(buf);
      let max = 0;
      for (const v of buf) max = Math.max(max, Math.abs(v - 128));
      return Math.min(1, max / 64);
    },
    zaustavi() {
      return new Promise<Blob>((resolve) => {
        rec.onstop = () => { ugasi(); resolve(new Blob(dijelovi, { type: rec.mimeType || 'audio/webm' })); };
        rec.stop();
      });
    },
    odustani() {
      rec.onstop = () => ugasi();
      try { rec.stop(); } catch { ugasi(); }
    },
  };
}

export function preuzmi(podaci: BlobPart, naziv: string, tip: string) {
  const blob = new Blob([podaci], { type: tip });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = naziv;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function procitajFajl(fajl: File): Promise<ArrayBuffer> {
  return fajl.arrayBuffer();
}

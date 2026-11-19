import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Vrsta = 'ok' | 'greska';
const Ctx = createContext<(poruka: string, vrsta?: Vrsta) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ poruka: string; vrsta: Vrsta } | null>(null);
  const timer = useRef<number>();
  const prikazi = useCallback((poruka: string, vrsta: Vrsta = 'ok') => {
    setToast({ poruka, vrsta });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), vrsta === 'greska' ? 4500 : 2200);
  }, []);
  return (
    <Ctx.Provider value={prikazi}>
      {children}
      <div aria-live="polite" role="status">
        {toast && <div className={`toast ${toast.vrsta === 'greska' ? 'greska' : ''}`}>{toast.poruka}</div>}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

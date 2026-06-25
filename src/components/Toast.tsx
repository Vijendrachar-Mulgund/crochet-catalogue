// Toast — lightweight transient message banner, exposed via useToast().
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ToastKind = 'ok' | 'err' | '';

interface ToastState {
  msg: string;
  kind: ToastKind;
  visible: boolean;
}

const ToastContext = createContext<(msg: string, kind?: ToastKind) => void>(
  () => {},
);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>({
    msg: '',
    kind: '',
    visible: false,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string, kind: ToastKind = '') => {
    setState({ msg, kind, visible: true });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setState((s) => ({ ...s, visible: false })),
      2800,
    );
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        id="toast"
        className={'toast' + (state.kind ? ' ' + state.kind : '')}
        hidden={!state.visible}
      >
        {state.msg}
      </div>
    </ToastContext.Provider>
  );
}

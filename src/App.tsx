import { useEffect } from "react";
import { store } from "./store";
import { ToastProvider } from "./components/Toast";
import { RouterProvider } from "react-router/dom";
import { router } from "./router";

function App() {
  useEffect(() => {
    store.seedIfEmpty().catch((err) => console.error(err));
  }, []);

  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

export default App;

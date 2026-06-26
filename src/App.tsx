import { ToastProvider } from "./components/Toast";
import { RouterProvider } from "react-router/dom";
import { router } from "./router";

function App() {
  // TODO: seed/initialise a data source here once one is wired up.

  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

export default App;

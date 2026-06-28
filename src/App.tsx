import { useEffect } from "react";
import { ToastProvider } from "./components/Toast";
import { RouterProvider } from "react-router/dom";
import { router } from "./router";
import { supabase } from "./services/database/connection";

function App() {
  useEffect(() => {
    async function authenticateUser() {
      const userID: string | null = localStorage.getItem("userID");

      if (userID) {
        const { data } = await supabase.auth.getUser();
        console.log("This is data from the App -> ", data);
      }
    }

    authenticateUser();
  }, []);

  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

export default App;

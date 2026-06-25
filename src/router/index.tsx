import { createBrowserRouter, useNavigate } from "react-router";
import { Layout } from "../components/Layout";
import { Catalogue } from "../components/Catalogue";
import { Categories } from "../components/Categories";
import { ShareBuilder } from "../components/ShareBuilder";
import { SettingsView } from "../components/SettingsView";

function SettingsRoute() {
  const navigate = useNavigate();
  return <SettingsView onRestored={() => navigate("/")} />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Catalogue /> },
      { path: "categories", element: <Categories /> },
      { path: "share", element: <ShareBuilder /> },
      { path: "settings", element: <SettingsRoute /> },
    ],
  },
]);

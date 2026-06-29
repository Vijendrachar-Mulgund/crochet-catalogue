import { createBrowserRouter } from "react-router";
import { Layout } from "../components/Layout";
import { Catalogue } from "../components/Catalogue";
import { Categories } from "../components/Categories";
import { ShareBuilder } from "../components/ShareBuilder";
import { Login } from "../components/Login";
import { SignUp } from "../components/SignUp";
import { requireAuth, redirectIfAuthed } from "../services/auth/auth-guard";
import { Profile } from "../components/Profile";

export const router = createBrowserRouter([
  // Auth pages — full-screen, outside the app shell.
  { path: "/login", element: <Login />, loader: redirectIfAuthed },
  { path: "/signup", element: <SignUp />, loader: redirectIfAuthed },
  {
    path: "/",
    element: <Layout />,
    loader: requireAuth,
    children: [
      { index: true, element: <Catalogue /> },
      { path: "categories", element: <Categories /> },
      { path: "share", element: <ShareBuilder /> },
      { path: "profile", element: <Profile /> },
    ],
  },
]);

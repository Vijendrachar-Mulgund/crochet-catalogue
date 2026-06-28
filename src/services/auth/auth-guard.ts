// Route guards for react-router loaders.
// Use `requireAuth` on protected routes and `redirectIfAuthed` on auth pages.
import { redirect } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../database/connection";
import { useUserStore } from "../../store/user";

// Loader guard: ensures a session exists, otherwise sends the user to /login
// (remembering where they were headed so we can return them after sign-in).

function setData(session: Session) {
  useUserStore.setState({ userID: session.user.id, user: session.user });
  localStorage.setItem("userID", session.user.id);
}

export async function requireAuth({ request }: { request: Request }): Promise<Session> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const from = new URL(request.url).pathname;
    throw redirect(`/login?from=${encodeURIComponent(from)}`);
  }

  setData(session);

  return session;
}

// Loader guard for /login and /signup: bounce already-signed-in users to the app.
export async function redirectIfAuthed(): Promise<null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    setData(session);
    throw redirect("/");
  }

  return null;
}

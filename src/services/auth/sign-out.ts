import { supabase } from "../../services/database/connection";
import { useUserStore } from "../../store/user";
import { redirect } from "react-router";

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (!error) {
    useUserStore.setState({ userID: null, user: null });
    localStorage.clear();
    redirect("/login");
    return;
  }

  console.error("An error occurred during sign out :", error);
}

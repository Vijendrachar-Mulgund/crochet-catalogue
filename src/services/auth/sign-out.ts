import { supabase } from "../../services/database/connection";
import { useUserStore } from "../../store/user";
import { router } from "../../router";

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (!error) {
    useUserStore.setState({ userID: null, user: null });
    localStorage.clear();
    router.navigate("/login");
    console.log("User Log out successful");
    return;
  }

  console.error("An error occurred during sign out :", error);
}

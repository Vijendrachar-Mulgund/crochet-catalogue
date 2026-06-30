import { supabase } from "../connection/connection";
import { useUserStore } from "../../store/user";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return error;
  }

  const userID: string | undefined = data.user?.id;

  if (!userID) {
    return false;
  }

  localStorage.setItem("userID", userID);
  useUserStore.setState({ userID: userID, user: data.user });

  console.log("User sign in successful");
}

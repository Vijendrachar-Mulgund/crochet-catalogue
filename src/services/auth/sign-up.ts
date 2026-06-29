import { supabase } from "../connection/connection";
import { insert } from "../database/insert";
import { useUserStore } from "../../store/user";

export async function signUpNewUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phone: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return error;
  }

  const payload = {
    tableName: "users",
    data: {
      id: data?.user?.id,
      firstname: firstName,
      lastname: lastName,
      email,
      phone_number: phone,
    },
  };

  // Insert Data in to the DB when Signup is complete
  const isDataInserted: boolean = await insert(payload);

  if (!isDataInserted) {
    return error;
  }

  const userID: string | undefined = data.user?.id;

  if (!userID) {
    return false;
  }

  localStorage.setItem("userID", userID);
  useUserStore.setState({ userID: userID, user: data.user });

  console.log("User sign up successful");
}

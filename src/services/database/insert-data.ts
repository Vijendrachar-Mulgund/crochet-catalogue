import { supabase } from "./connection";

export async function insertData(payload: any) {
  const { data, error } = await supabase.from("your_table_name").insert([payload]).select();

  if (error) console.error("Error inserting data:", error);
  else console.log("Inserted data:", data);
}

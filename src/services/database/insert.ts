import { supabase } from "../connection/connection";

export async function insert(payload: { tableName: string; data: any }) {
  const { data, error } = await supabase.from(payload?.tableName).insert([payload?.data]).select();

  if (error) {
    console.error("Error inserting data:", error);
    return { data: null, error };
  }

  console.log("Inserted data:", data);

  return { data, error };
}

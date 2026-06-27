import { supabase } from "./connection";

export async function insertData(payload: { tableName: string; data: any }) {
  const { data, error } = await supabase.from(payload?.tableName).insert([payload?.data]).select();

  if (error) {
    console.error("Error inserting data:", error);
    return false;
  }

  console.log("Inserted data:", data);

  return true;
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dukxmpgummncvzldpmmf.supabase.co/rest/v1/";
const supabaseKey = "sb_publishable_7KhkE7gYNMjfXEVH9kCNtQ_W-gVqxC4";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

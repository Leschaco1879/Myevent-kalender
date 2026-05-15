import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dukxmpgummncvzldpmmf.storage.supabase.co/storage/v1/s3";
const supabaseKey = "sb_publishable_7KhkE7gYNMjfXEVH9kCNtQ_W-gVqxC4";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

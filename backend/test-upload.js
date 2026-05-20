require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL || "https://cwaiqkgimqdjsznrizgt.supabase.co", 
  process.env.SUPABASE_ANON_KEY
);

async function testUpload() {
  const { data, error } = await supabase.storage
    .from("vendor-images")
    .upload("test.txt", "hello world", {
      contentType: "text/plain",
      upsert: true,
    });

  if (error) {
    console.error("Upload Error:", error);
  } else {
    console.log("Upload Success:", data);
  }
}

testUpload();

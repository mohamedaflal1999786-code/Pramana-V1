import { createClient } from "@supabase/supabase-js";
async function testSignIn() {
  const url=process.env.PRAMANA_TEST_SUPABASE_URL;
  const key=process.env.PRAMANA_TEST_PUBLISHABLE_KEY;
  const email=process.env.PRAMANA_TEST_EMAIL;
  const password=process.env.PRAMANA_TEST_PASSWORD;
  if (!url || !["localhost","127.0.0.1"].includes(new URL(url).hostname) || !key || !email || !password) throw new Error("Isolated test service and fixture account required.");
  const client=createClient(url,key);
  const {data,error}=await client.auth.signInWithPassword({email,password});
  if(error || !data.session) throw new Error("Fixture login failed.");
  await client.auth.signOut();
}
testSignIn().catch(()=>{console.error("Isolated sign-in check failed.");process.exitCode=1;});

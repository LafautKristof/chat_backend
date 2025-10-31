import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL;
const INTERVAL_MINUTES = 30;

async function pingSupabase() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                apikey: process.env.SUPABASE_ANON_KEY || "",
            },
        });

        if (response.ok) {
            console.log(
                `✅ Supabase responded OK at ${new Date().toLocaleTimeString()}`
            );
        } else {
            console.warn(
                `⚠️ Supabase returned ${response.status} (${response.statusText})`
            );
        }
    } catch (error) {
        console.error("❌ Error pinging Supabase:", (error as Error).message);
    }
}

pingSupabase();

setInterval(pingSupabase, INTERVAL_MINUTES * 60 * 1000);

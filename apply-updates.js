require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyUpdates() {
    const data = JSON.parse(fs.readFileSync('descriptions.json', 'utf8'));
    let success = 0;
    let failed = 0;
    
    for (const [providerId, description] of Object.entries(data)) {
        const cleanDesc = description.replace(/\nإنشاء طلب$/g, '').trim();
        const { error } = await supabase
            .from('services')
            .update({ description: cleanDesc })
            .eq('provider_service_id', providerId);
            
        if (error) {
            console.error(`Error updating ${providerId}:`, error.message);
            failed++;
        } else {
            success++;
            process.stdout.write(`\r✅ Updated ${success}`);
        }
    }
    console.log(`\n🎉 Done! Success: ${success}, Failed: ${failed}`);
}

applyUpdates().catch(console.error);

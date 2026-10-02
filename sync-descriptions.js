require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');
const fs = require('fs');

async function syncDescriptions() {
    console.log("🚀 Starting Description Sync from XFollowr...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Go to the services page
    console.log("Loading XFollowr services page...");
    await page.goto('https://xfollowr.com/services', { waitUntil: 'networkidle' });
    
    // Find all buttons that trigger a description modal
    const buttons = await page.$$('button[data-description-id]');
    console.log(`Found ${buttons.length} services with descriptions on the page.`);
    
    let descriptionsMap = {};
    let updatedCount = 0;
    
    for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        const providerId = await btn.getAttribute('data-description-id');
        if (!providerId) continue;
        
        try {
            await btn.click();
            await page.waitForTimeout(600); // Wait for modal
            
            const modalBody = page.locator('.modal-body').first();
            const text = await modalBody.innerText();
            
            const closeBtn = page.locator('.modal-header button.close').first();
            if (await closeBtn.isVisible()) {
                await closeBtn.click();
                await page.waitForTimeout(300);
            } else {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(300);
            }
            
            const description = text.trim();
            if (description && description.length > 5) {
                descriptionsMap[providerId] = description;
                updatedCount++;
                process.stdout.write(`\r✅ Fetched service ID ${providerId} (${updatedCount}/${buttons.length})`);
                
                // Write to file incrementally to be safe
                fs.writeFileSync('descriptions.json', JSON.stringify(descriptionsMap, null, 2));
            }
        } catch (err) {
            console.log(`\n❌ Failed to sync description for ${providerId}: ${err.message}`);
            await page.keyboard.press('Escape');
        }
    }
    
    console.log(`\n🎉 Finished fetching ${updatedCount} descriptions. Saved to descriptions.json!`);
    await browser.close();
}

syncDescriptions().catch(console.error);

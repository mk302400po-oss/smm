const fs = require('fs');

const data = JSON.parse(fs.readFileSync('descriptions.json', 'utf8'));

let sql = '';
for (const [providerId, description] of Object.entries(data)) {
    // Escape single quotes
    const safeDesc = description.replace(/'/g, "''");
    // Replace "إنشاء طلب" which is at the end of every description because of the button
    const cleanDesc = safeDesc.replace(/\nإنشاء طلب$/g, '').trim();
    
    sql += `UPDATE services SET description = '${cleanDesc}' WHERE provider_service_id = '${providerId}';\n`;
}

fs.writeFileSync('update_descriptions.sql', sql, 'utf8');
console.log('SQL generated!');

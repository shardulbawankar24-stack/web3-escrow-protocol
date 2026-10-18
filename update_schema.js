/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

if (!schema.includes('beneficiaries')) {
    schema = schema.replace('cadence                String?', 'cadence                String?\n  beneficiaries          String?  // JSON string or comma separated');
    fs.writeFileSync(schemaPath, schema);
    console.log("Schema updated");
} else {
    console.log("Schema already has beneficiaries");
}

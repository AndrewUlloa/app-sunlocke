import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables from .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Constants
const D1_DATABASE_ID = process.env.D1_DATABASE_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

// Helper function to make D1 queries
async function queryD1(sql, params = []) {
    console.log('\nExecuting SQL:', sql);
    console.log('With params:', params);

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({ sql, params })
    });

    const result = await response.json();
    console.log('Query result:', result);

    if (!response.ok || !result.success) {
        console.error('Query failed:', result);
        throw new Error(`D1 query failed: ${response.statusText}`);
    }
    return result;
}

// Main function to create tables
async function createTables() {
    try {
        // Read the SQL file
        const sqlPath = join(__dirname, 'create-tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split the SQL into individual statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        // Execute each statement
        for (const statement of statements) {
            console.log('\nExecuting statement:', statement);
            await queryD1(statement);
        }
        
        console.log('\nAll tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
        process.exit(1);
    }
}

// Run the script
createTables(); 
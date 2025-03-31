import * as dotenv from 'dotenv';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
    console.log('\nQuery response:', JSON.stringify(result, null, 2));
    
    if (!response.ok || !result.success) {
        console.error('Query failed:', result);
        throw new Error(`D1 query failed: ${response.statusText}`);
    }
    return result;
}

// Function to get all channels and create a name to ID mapping
async function getChannelMapping() {
    const result = await queryD1('SELECT * FROM Channels');
    if (!result.result?.[0]?.results) {
        throw new Error('No channels found in database');
    }

    const channelMap = new Map();
    for (const channel of result.result[0].results) {
        channelMap.set(channel.channel_name.trim(), channel.channel_id);
    }
    
    console.log('\nChannel mapping:', Object.fromEntries(channelMap));
    return channelMap;
}

// Function to process the CSV file and insert question-channel relationships
async function processQuestionChannels() {
    try {
        // Get channel mapping
        console.log('\nFetching channel mapping...');
        const channelMap = await getChannelMapping();

        // Create a set to track unique question-channel pairs
        const processedPairs = new Set();

        // Process the CSV file
        console.log('\nReading dataset.csv...');
        const csvPath = join(__dirname, 'dataset.csv');
        console.log('CSV file path:', csvPath);

        const parser = createReadStream(csvPath).pipe(parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            cast: false,
            columns: headers => headers.map(h => h.trim())
        }));

        let recordCount = 0;
        console.log('\nProcessing dataset.csv...');
        
        for await (const record of parser) {
            recordCount++;
            console.log('\nRaw record:', record);
            console.log('Record keys:', Object.keys(record));
            
            const questionId = parseInt(record.question_id.toString().replace(/[^\d]/g, ''));
            console.log('Parsed question_id:', questionId);
            
            if (!questionId || isNaN(questionId)) {
                console.log(`Skipping invalid question_id: ${record.question_id}`);
                continue;
            }

            if (!record['Relevant Channel']) {
                console.log(`Skipping question ${questionId}: no relevant channels`);
                continue;
            }

            const relevantChannels = record['Relevant Channel'].split(',').map(c => c.trim()).filter(Boolean);
            console.log(`Processing question ${questionId} with channels:`, relevantChannels);

            if (relevantChannels.length === 0) {
                console.log(`Skipping question ${questionId}: no valid channels after parsing`);
                continue;
            }

            for (const channelName of relevantChannels) {
                const channelId = channelMap.get(channelName);
                if (!channelId) {
                    console.warn(`Warning: Channel "${channelName}" not found in database for question ${questionId}`);
                    continue;
                }

                const pairKey = `${questionId}-${channelId}`;
                if (processedPairs.has(pairKey)) {
                    console.log(`Skipping duplicate pair: ${pairKey}`);
                    continue;
                }

                try {
                    console.log(`Inserting relationship: Question ${questionId} - Channel ${channelId} (${channelName})`);
                    await queryD1(
                        'INSERT INTO QuestionChannels (question_id, channel_id) VALUES (?, ?)',
                        [questionId, channelId]
                    );
                    processedPairs.add(pairKey);
                    console.log(`Successfully inserted relationship: Question ${questionId} - Channel ${channelId}`);
                } catch (error) {
                    if (error.message.includes('UNIQUE constraint failed')) {
                        console.log(`Relationship already exists: Question ${questionId} - Channel ${channelId}`);
                    } else {
                        console.error('Error inserting relationship:', error);
                        throw error;
                    }
                }
            }
        }

        console.log(`\nProcessed ${recordCount} records`);
        console.log(`Inserted ${processedPairs.size} question-channel relationships`);
        console.log('\nFinished processing question-channel relationships');
    } catch (error) {
        console.error('Error processing question channels:', error);
        throw error;
    }
}

// Main function
async function main() {
    try {
        // Validate environment variables
        if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID || !D1_DATABASE_ID) {
            throw new Error('Missing required environment variables');
        }

        await processQuestionChannels();
        console.log('Successfully populated QuestionChannels table');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main(); 
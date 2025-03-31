import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import * as dotenv from 'dotenv';
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
    console.log('Query result:', result);

    if (!response.ok || !result.success) {
        console.error('Query failed:', result);
        throw new Error(`D1 query failed: ${response.statusText}`);
    }
    return result;
}

// Function to ensure all channels exist and get their IDs
async function ensureChannels(channelNames) {
    console.log('\nProcessing channels:', Array.from(channelNames));
    const channels = new Map();
    
    for (const name of channelNames) {
        const trimmedName = name.trim();
        if (!trimmedName) {
            console.log('Skipping empty channel name');
            continue;
        }

        console.log(`\nProcessing channel: "${trimmedName}"`);
        // Try to insert the channel, if it exists it will be returned
        const result = await queryD1(
            `INSERT INTO Channels (channel_name) 
             VALUES (?) 
             ON CONFLICT (channel_name) 
             DO UPDATE SET channel_name = excluded.channel_name 
             RETURNING channel_id, channel_name`,
            [trimmedName]
        );

        if (result.results?.[0]?.[0]) {
            const channelId = result.results[0][0].channel_id;
            channels.set(trimmedName, channelId);
            console.log(`Channel "${trimmedName}" mapped to ID: ${channelId}`);
        } else {
            console.warn(`Warning: No channel ID returned for "${trimmedName}"`);
        }
    }

    console.log('\nFinal channel mapping:', Object.fromEntries(channels));
    return channels;
}

// Function to ensure a value is a number
function toNumber(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

// Function to normalize question type to match database constraints
function normalizeQuestionType(type) {
    if (!type) return 'Baseline';
    
    // Map of common variations to correct format
    const typeMap = {
        'combination specific': 'Combination-Specific',
        'combination-specific': 'Combination-Specific',
        'combination': 'Combination-Specific',
        'singular': 'Singular',
        'baseline': 'Baseline'
    };
    
    // Clean and standardize the input
    const cleanType = type.trim().toLowerCase();
    return typeMap[cleanType] || 'Baseline';
}

// Function to process the CSV file
async function processCSV(filePath) {
    console.log('\nReading CSV file:', filePath);
    const records = [];
    
    const parser = createReadStream(filePath).pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true,
        // Convert known numeric columns to numbers
        cast_date: false,
        columns: (headers) => {
            console.log('CSV Headers:', headers);
            return headers.map(h => h.trim());
        }
    }));

    let recordCount = 0;
    let skippedCount = 0;
    
    for await (const record of parser) {
        recordCount++;
        
        // Skip truly empty records
        if (!record || Object.keys(record).length === 0) {
            console.log('Skipping empty record');
            skippedCount++;
            continue;
        }

        // Convert question_id to number and validate
        const questionId = toNumber(record.question_id);
        console.log(`Processing record #${recordCount} (ID: ${questionId}):`, {
            raw_id: record.question_id,
            parsed_id: questionId
        });

        if (questionId <= 0) {
            console.log(`Skipping record with invalid question ID: ${record.question_id}`);
            skippedCount++;
            continue;
        }

        // Get all unique channels from the record
        const channels = record['Relevant Channel']
            ?.split(',')
            .map(c => c.trim())
            .filter(Boolean) || [];

        // Create the record object with explicit number conversions and normalized question type
        const processedRecord = {
            question_id: questionId,
            question_text: record.Question?.trim(),
            question_type: normalizeQuestionType(record.question_type),
            question_number: `Q${questionId}`,
            channels,
            options: []
        };

        console.log('Question type:', {
            original: record.question_type,
            normalized: processedRecord.question_type
        });

        // Process each option and its weights with explicit number conversions
        for (let i = 1; i <= 4; i++) {
            const optionText = record[`Option ${i}`];
            if (optionText && optionText.trim()) {
                const option = {
                    option_text: optionText.trim(),
                    question_id: questionId,
                    weights: {
                        awareness: toNumber(record[`O${i}_PW1_Awareness`]),
                        credibility: toNumber(record[`O${i}_PW2_Credibility`]),
                        communication: toNumber(record[`O${i}_PW3_Communication`]),
                        retention: toNumber(record[`O${i}_PW4_Retention`]),
                        engagement: toNumber(record[`O${i}_PW5_Engagement`]),
                        strategy: toNumber(record[`O${i}_PW6_Strategy`])
                    }
                };
                processedRecord.options.push(option);
                console.log(`Option ${i} weights:`, option.weights);
            }
        }

        records.push(processedRecord);
        console.log('Record processed successfully:', {
            id: processedRecord.question_id,
            type: processedRecord.question_type,
            channels: processedRecord.channels.length,
            options: processedRecord.options.length
        });
    }

    console.log(`\nProcessing summary:`);
    console.log(`Total records found: ${recordCount}`);
    console.log(`Records skipped: ${skippedCount}`);
    console.log(`Records processed: ${records.length}`);
    
    if (records.length === 0) {
        throw new Error('No valid records were processed from the CSV file');
    }

    // Validate all records have valid numeric IDs
    const invalidRecords = records.filter(r => !Number.isInteger(r.question_id) || r.question_id <= 0);
    if (invalidRecords.length > 0) {
        console.error('Found records with invalid IDs:', invalidRecords.map(r => r.question_id));
        throw new Error('Some records have invalid question IDs');
    }
    
    return records;
}

// Function to insert data into D1
async function insertIntoD1(data) {
    console.log('\nStarting data insertion...');
    console.log(`Preparing to insert ${data.length} records`);
    
    // First, get all unique channels across all questions
    const allChannels = new Set();
    data.forEach(record => record.channels.forEach(channel => allChannels.add(channel)));
    console.log('\nUnique channels found:', Array.from(allChannels));
    
    if (allChannels.size === 0) {
        console.log('No channels found to process');
    }
    
    // Ensure all channels exist and get their IDs
    console.log('\nEnsuring channels exist...');
    const channelMap = await ensureChannels(allChannels);

    // Process each question
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of data) {
        try {
            console.log(`\n=== Processing question ${record.question_id} ===`);
            console.log('Question text:', record.question_text);

            // Validate question_id
            if (!Number.isInteger(record.question_id) || record.question_id <= 0) {
                throw new Error(`Invalid question_id: ${record.question_id}`);
            }

            // Insert question
            console.log('Inserting question...');
            const questionResult = await queryD1(
                `INSERT INTO Questions (question_id, question_text, question_type, question_number)
                 VALUES (?, ?, ?, ?)`,
                [record.question_id, record.question_text, record.question_type, record.question_number]
            );
            console.log('Question inserted:', questionResult.success);

            // Insert channel associations
            console.log('Processing channel associations...');
            for (const channel of record.channels) {
                const channelId = channelMap.get(channel);
                if (channelId) {
                    console.log(`Linking question to channel "${channel}" (ID: ${channelId})`);
                    const channelResult = await queryD1(
                        `INSERT INTO QuestionChannels (question_id, channel_id)
                         VALUES (?, ?)`,
                        [record.question_id, channelId]
                    );
                    console.log('Channel link created:', channelResult.success);
                } else {
                    console.warn(`Warning: No channel ID found for "${channel}"`);
                }
            }

            // Insert options with weights
            console.log(`Processing ${record.options.length} options...`);
            for (const option of record.options) {
                // Verify question_id matches
                if (option.question_id !== record.question_id) {
                    throw new Error(`Option question_id mismatch: ${option.question_id} !== ${record.question_id}`);
                }

                console.log('Inserting option:', {
                    text: option.option_text.substring(0, 50) + '...',
                    question_id: option.question_id,
                    weights: option.weights
                });
                const optionResult = await queryD1(
                    `INSERT INTO Options (
                        question_id,
                        option_text,
                        weight_awareness,
                        weight_credibility,
                        weight_communication,
                        weight_retention,
                        weight_engagement,
                        weight_strategy
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        option.question_id,
                        option.option_text,
                        option.weights.awareness,
                        option.weights.credibility,
                        option.weights.communication,
                        option.weights.retention,
                        option.weights.engagement,
                        option.weights.strategy
                    ]
                );
                console.log('Option inserted:', optionResult.success);
            }

            console.log(`Successfully processed question ${record.question_id}`);
            successCount++;
        } catch (error) {
            console.error(`\nERROR processing question ${record.question_id}:`, error);
            console.error('Failed record:', record);
            errorCount++;
            throw error;
        }
    }

    console.log('\nInsertion summary:');
    console.log(`Successfully processed: ${successCount} records`);
    console.log(`Failed to process: ${errorCount} records`);
}

// Main function
async function main() {
    try {
        // Validate environment variables
        if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID || !D1_DATABASE_ID) {
            throw new Error('Missing required environment variables');
        }

        // Get CSV file path from command line argument
        const csvPath = process.argv[2];
        if (!csvPath) {
            throw new Error('Please provide the path to your CSV file as a command line argument');
        }

        // Process CSV file
        console.log('Processing CSV file...');
        const data = await processCSV(csvPath);
        console.log(`Found ${data.length} records`);

        // Insert data into D1
        console.log('Inserting data into D1...');
        await insertIntoD1(data);
        
        console.log('Data import completed successfully!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();

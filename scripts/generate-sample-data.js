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
    console.log('\nQuery response:', JSON.stringify(result, null, 2));
    
    if (!response.ok || !result.success) {
        console.error('Query failed:', result);
        throw new Error(`D1 query failed: ${response.statusText}`);
    }
    return result;
}

// Helper function to generate a random date within the last 30 days
function getRandomDate() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
    return new Date(randomTime).toISOString();
}

// Helper function to get random items from an array
function getRandomItems(array, min, max) {
    const count = min + Math.floor(Math.random() * (max - min + 1));
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Helper function to generate a score label based on a numeric score
function generateLabel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Slight Problem';
    return 'Significant Problem';
}

// Helper function to check table structure
async function checkTableStructure() {
    console.log('\nChecking table structures...');
    
    const tables = ['QuizSessions', 'QuizResponses', 'calculation_results', 'new_reports'];
    
    for (const table of tables) {
        console.log(`\nChecking structure of ${table}...`);
        const result = await queryD1(`PRAGMA table_info(${table})`);
        console.log(`${table} columns:`, result.result[0].results);
    }
}

// Helper function to generate sample user data
function generateSampleUserData() {
    const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Marketing'];
    const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'James', 'Emily'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    
    return {
        first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
        last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
        email: `test.user.${Math.floor(Math.random() * 10000)}@example.com`,
        industry: industries[Math.floor(Math.random() * industries.length)]
    };
}

// Function to generate sample quiz sessions and responses
async function generateSampleData(numSessions = 10) {
    try {
        // First check table structures
        await checkTableStructure();
        
        console.log('\nFetching existing questions and channels...');
        
        // Get all questions
        console.log('\nQuerying Questions table...');
        const questionsResult = await queryD1('SELECT * FROM Questions');
        console.log('Questions result structure:', {
            hasResult: !!questionsResult.result,
            resultLength: questionsResult.result?.length,
            firstResultData: questionsResult.result?.[0]?.results,
            questionsCount: questionsResult.result?.[0]?.results?.length
        });
        
        if (!questionsResult.result?.[0]?.results) {
            console.error('Questions query returned invalid structure:', questionsResult);
            throw new Error('No questions found in the database');
        }
        const questions = questionsResult.result[0].results;
        console.log(`Found ${questions.length} questions in the database`);
        
        // Get all channels
        console.log('\nQuerying Channels table...');
        const channelsResult = await queryD1('SELECT * FROM Channels');
        console.log('Channels result structure:', {
            hasResult: !!channelsResult.result,
            resultLength: channelsResult.result?.length,
            firstResultData: channelsResult.result?.[0]?.results,
            channelsCount: channelsResult.result?.[0]?.results?.length
        });
        
        if (!channelsResult.result?.[0]?.results) {
            console.error('Channels query returned invalid structure:', channelsResult);
            throw new Error('No channels found in the database');
        }
        const channels = channelsResult.result[0].results;
        console.log(`Found ${channels.length} channels in the database`);
        
        // Get all options
        console.log('\nQuerying Options table...');
        const optionsResult = await queryD1('SELECT * FROM Options');
        console.log('Options result structure:', {
            hasResult: !!optionsResult.result,
            resultLength: optionsResult.result?.length,
            firstResultData: optionsResult.result?.[0]?.results,
            optionsCount: optionsResult.result?.[0]?.results?.length
        });
        
        if (!optionsResult.result?.[0]?.results) {
            console.error('Options query returned invalid structure:', optionsResult);
            throw new Error('No options found in the database');
        }
        const options = optionsResult.result[0].results;
        console.log(`Found ${options.length} options in the database`);
        
        console.log(`\nGenerating ${numSessions} sample quiz sessions...`);
        
        for (let i = 0; i < numSessions; i++) {
            console.log(`\nGenerating session ${i + 1}/${numSessions}`);
            
            // 1. Create a quiz session
            const timestamp = getRandomDate();
            const selectedChannels = getRandomItems(channels, 2, 4)
                .map(channel => channel.channel_id)
                .join(',');
            
            // Generate sample user data
            const userData = generateSampleUserData();
            
            const sessionResult = await queryD1(
                `INSERT INTO QuizSessions (
                    created_at, 
                    q0_channels, 
                    user_id,
                    first_name,
                    last_name,
                    email,
                    industry
                ) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING session_id`,
                [
                    timestamp, 
                    selectedChannels,
                    null, // user_id is null for sample data
                    userData.first_name,
                    userData.last_name,
                    userData.email,
                    userData.industry
                ]
            );
            
            const sessionId = sessionResult.result[0].results[0].session_id;
            console.log('Created session:', sessionId);
            
            // 2. Generate responses for each question
            for (const question of questions) {
                // Get options for this question
                const questionOptions = options.filter(o => o.question_id === question.question_id);
                if (questionOptions.length === 0) continue;
                
                // Randomly select an option
                const selectedOption = questionOptions[Math.floor(Math.random() * questionOptions.length)];
                
                // Record the response with current timestamp
                await queryD1(
                    'INSERT INTO QuizResponses (session_id, question_id, selected_option_id, answered_at) VALUES (?, ?, ?, ?)',
                    [sessionId, question.question_id, selectedOption.id, new Date().toISOString()]
                );
            }
            
            // 3. Generate calculation results
            const scores = {
                awareness: Math.floor(Math.random() * 100),
                credibility: Math.floor(Math.random() * 100),
                communication: Math.floor(Math.random() * 100),
                retention: Math.floor(Math.random() * 100),
                engagement: Math.floor(Math.random() * 100),
                strategy: Math.floor(Math.random() * 100)
            };
            
            await queryD1(
                `INSERT INTO calculation_results (
                    session_id,
                    awareness_score, awareness_label,
                    credibility_score, credibility_label,
                    communication_score, communication_label,
                    retention_score, retention_label,
                    engagement_score, engagement_label,
                    strategy_score, strategy_label,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    sessionId,
                    scores.awareness, generateLabel(scores.awareness),
                    scores.credibility, generateLabel(scores.credibility),
                    scores.communication, generateLabel(scores.communication),
                    scores.retention, generateLabel(scores.retention),
                    scores.engagement, generateLabel(scores.engagement),
                    scores.strategy, generateLabel(scores.strategy),
                    new Date().toISOString()
                ]
            );
            
            // 4. Generate a sample final report
            const reportText = `Sample marketing assessment report for session ${sessionId}.\n\n` +
                `Based on our analysis, your marketing effectiveness scores are as follows:\n\n` +
                `Awareness: ${scores.awareness}% (${generateLabel(scores.awareness)})\n` +
                `Credibility: ${scores.credibility}% (${generateLabel(scores.credibility)})\n` +
                `Communication: ${scores.communication}% (${generateLabel(scores.communication)})\n` +
                `Retention: ${scores.retention}% (${generateLabel(scores.retention)})\n` +
                `Engagement: ${scores.engagement}% (${generateLabel(scores.engagement)})\n` +
                `Strategy: ${scores.strategy}% (${generateLabel(scores.strategy)})\n\n` +
                'This is a sample generated report for testing purposes.';
            
            await queryD1(
                'INSERT INTO new_reports (session_id, insights, generated_timestamp) VALUES (?, ?, ?)',
                [sessionId, reportText, new Date().toISOString()]
            );
            
            console.log(`Completed session ${sessionId} with all related data`);
        }
        
        console.log('\nSample data generation completed successfully!');
        
    } catch (error) {
        console.error('Error generating sample data:', error);
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

        // Generate sample data
        const numSessions = process.argv[2] ? parseInt(process.argv[2]) : 10;
        await generateSampleData(numSessions);
        
        console.log('Sample data generation completed successfully!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main(); 
import { execSync } from 'child_process';

// Get the SQL command from command line arguments
const sqlCommand = process.argv.slice(2).join(' ');

if (!sqlCommand) {
  console.error('Please provide an SQL command');
  process.exit(1);
}

try {
  // Execute on local
  console.log('\n🔧 Executing on local database...');
  execSync(`wrangler d1 execute sun-locke-db --command "${sqlCommand}"`, { stdio: 'inherit' });
  
  // Execute on remote
  console.log('\n🌎 Executing on remote database...');
  execSync(`wrangler d1 execute sun-locke-db --remote --command "${sqlCommand}"`, { stdio: 'inherit' });
  
  console.log('\n✅ Command executed successfully on both databases');
} catch (error) {
  console.error('\n❌ Error executing command:', error.message);
  process.exit(1);
} 
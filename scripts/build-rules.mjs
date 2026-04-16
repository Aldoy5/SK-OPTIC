import fs from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const TEMPLATE_PATH = resolve(ROOT_DIR, 'firestore.rules.template');
const OUTPUT_PATH = resolve(ROOT_DIR, 'firestore.rules');

/**
 * Parses a comma-separated string into a JSON array string
 * e.g. "email1@test.com,email2@test.com" -> '["email1@test.com", "email2@test.com"]'
 */
function parseToArrayString(envVarValue) {
  if (!envVarValue) return '[]';
  const items = envVarValue.split(',').map(item => item.trim()).filter(Boolean);
  return JSON.stringify(items);
}

async function buildRules() {
  try {
    console.log('Compiling Firebase rules from template...');

    // Read the template
    let template = await fs.readFile(TEMPLATE_PATH, 'utf-8');

    // Extract env variables
    const adminEmails = parseToArrayString(process.env.ADMIN_EMAILS);
    const adminUids = parseToArrayString(process.env.ADMIN_UIDS);

    // Default fallbacks during development if not defined in .env
    const finalAdminEmails = adminEmails === '[]' ? '["test@example.com"]' : adminEmails;
    const finalAdminUids = adminUids === '[]' ? '["dummy-uid"]' : adminUids;

    // Apply replacements
    template = template.replace(/__ADMIN_EMAILS__/g, finalAdminEmails);
    template = template.replace(/__ADMIN_UIDS__/g, finalAdminUids);

    // Save to the output file
    await fs.writeFile(OUTPUT_PATH, template, 'utf-8');
    
    console.log(`Successfully generated firestore.rules with provided env variables.`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: Could not find template file at ${TEMPLATE_PATH}. Please make sure firestore.rules.template exists.`);
    } else {
      console.error('Failed to build rules:', error);
    }
    process.exit(1);
  }
}

buildRules();

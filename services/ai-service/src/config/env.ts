import { config } from 'dotenv';
import { resolve } from 'node:path';

// Service-specific values override the shared root configuration when present.
config();
config({ path: resolve(process.cwd(), '../../.env') });

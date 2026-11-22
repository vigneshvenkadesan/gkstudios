import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getStudioState } from '../src/server/studioStore';
import mongoose from 'mongoose';

async function main() {
  console.log('Seeding MongoDB services & packages catalog...');
  const state = await getStudioState();
  console.log(`Successfully loaded state!`);
  console.log(`Services seeded: ${state.services?.length || 0}`);
  console.log(`Packages seeded: ${state.packages?.length || 0}`);
  if (state.packages && state.packages.length > 0) {
    state.packages.forEach((pkg) => {
      console.log(` - [${pkg.id}] ${pkg.name} (${pkg.priceLabel}) - durationTier: ${pkg.durationTier}`);
    });
  }
  await mongoose.disconnect();
  console.log('Done!');
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

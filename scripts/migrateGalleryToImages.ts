import { loadEnvConfig } from '@next/env';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getGalleryImageModel } from '../src/server/mongodb';

interface LegacyGalleryImage {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  [field: string]: unknown;
}

loadEnvConfig(process.cwd());

async function migrateGallery() {
  const sourcePath = path.join(process.cwd(), 'data', 'studio-db.json');
  const content = await readFile(sourcePath, 'utf8');
  const source = JSON.parse(content) as { portfolio?: unknown };
  if (!Array.isArray(source.portfolio)) {
    throw new Error('The legacy studio data does not contain a portfolio array.');
  }

  const images = await getGalleryImageModel();
  if (!images) {
    throw new Error('MongoDB is not configured. Set MONGODB_URI before migrating gallery images.');
  }
  if ((await images.estimatedDocumentCount()) > 0) {
    throw new Error('The images collection is not empty; migration stopped to avoid duplicates.');
  }

  const records = source.portfolio.map((value, index) => {
    if (!value || typeof value !== 'object') {
      throw new Error(`Legacy gallery item ${index + 1} is invalid.`);
    }
    const item = value as Partial<LegacyGalleryImage>;
    if (
      typeof item.id !== 'string' ||
      typeof item.title !== 'string' ||
      typeof item.category !== 'string' ||
      typeof item.imageUrl !== 'string'
    ) {
      throw new Error(`Legacy gallery item ${index + 1} is missing required fields.`);
    }
    return {
      ...item,
      secure_url: typeof item.secure_url === 'string' ? item.secure_url : item.imageUrl,
    };
  });

  if (records.length > 0) {
    await images.insertMany(records, { ordered: true });
  }
  console.log(`Migrated ${records.length} gallery images to the MongoDB images collection.`);
}

migrateGallery().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Gallery migration failed.');
  process.exitCode = 1;
});

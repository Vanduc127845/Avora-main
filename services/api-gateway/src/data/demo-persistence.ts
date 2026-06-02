import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { UserProfile } from '../types/shared.js';
import {
  demoAgentMemories,
  demoConfidenceEntries,
  demoSettings,
  demoPartnerInquiries,
  demoProfiles,
  demoSavedJobs,
  demoUsers,
  type DemoAgentMemory,
  type DemoConfidenceEntry,
  type DemoUserSettings,
  type DemoPartnerInquiry,
  type DemoUser,
} from './demo-store.js';
import { logger } from '../utils/logger.js';

type PersistedDemoData = {
  version: 3;
  updatedAt: string;
  users: DemoUser[];
  profiles: UserProfile[];
  savedJobs: { userId: string; jobIds: string[] }[];
  agentMemories: DemoAgentMemory[];
  confidenceEntries: DemoConfidenceEntry[];
  settings: DemoUserSettings[];
  partnerInquiries: DemoPartnerInquiry[];
};

const demoDataFile =
  process.env.DEMO_DATA_FILE || path.resolve(process.cwd(), 'data/demo-db.json');

let saveQueue = Promise.resolve();

const emptyDemoData = (): PersistedDemoData => ({
  version: 3,
  updatedAt: new Date().toISOString(),
  users: [],
  profiles: [],
  savedJobs: [],
  agentMemories: [],
  confidenceEntries: [],
  settings: [],
  partnerInquiries: [],
});

export async function loadDemoData(): Promise<void> {
  try {
    const raw = await readFile(demoDataFile, 'utf8');
    const data = JSON.parse(raw.replace(/^\uFEFF/, '')) as Partial<PersistedDemoData>;

    demoUsers.clear();
    for (const user of data.users || []) {
      if (user.id && user.email && user.passwordHash) {
        demoUsers.set(user.id, user);
      }
    }

    demoProfiles.clear();
    for (const profile of data.profiles || []) {
      if (profile.id) {
        demoProfiles.set(profile.id, profile);
      }
    }

    demoSavedJobs.clear();
    for (const saved of data.savedJobs || []) {
      if (saved.userId) {
        demoSavedJobs.set(saved.userId, new Set(saved.jobIds || []));
      }
    }

    demoAgentMemories.clear();
    for (const memory of data.agentMemories || []) {
      if (memory.userId && memory.agentId) {
        demoAgentMemories.set(`${memory.userId}:${memory.agentId}`, memory);
      }
    }

    demoConfidenceEntries.clear();
    for (const entry of data.confidenceEntries || []) {
      if (entry.id && entry.userId) {
        demoConfidenceEntries.set(entry.id, entry);
      }
    }

    demoSettings.clear();
    for (const settings of data.settings || []) {
      if (settings.userId) {
        demoSettings.set(settings.userId, settings);
      }
    }

    demoPartnerInquiries.clear();
    for (const inquiry of data.partnerInquiries || []) {
      if (inquiry.id) {
        demoPartnerInquiries.set(inquiry.id, inquiry);
      }
    }

    logger.info('Loaded demo data store', {
      users: demoUsers.size,
      profiles: demoProfiles.size,
      savedJobs: demoSavedJobs.size,
      agentMemories: demoAgentMemories.size,
      confidenceEntries: demoConfidenceEntries.size,
      settings: demoSettings.size,
      partnerInquiries: demoPartnerInquiries.size,
      file: demoDataFile,
    });
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      logger.warn('Could not load demo data store', { error, file: demoDataFile });
    }
  }
}

export async function saveDemoData(): Promise<void> {
  const task = saveQueue.catch(() => undefined).then(async () => {
    const data: PersistedDemoData = {
      ...emptyDemoData(),
      users: [...demoUsers.values()],
      profiles: [...demoProfiles.values()],
      savedJobs: [...demoSavedJobs.entries()].map(([userId, jobIds]) => ({
        userId,
        jobIds: [...jobIds],
      })),
      agentMemories: [...demoAgentMemories.values()],
      confidenceEntries: [...demoConfidenceEntries.values()],
      settings: [...demoSettings.values()],
      partnerInquiries: [...demoPartnerInquiries.values()],
    };

    await mkdir(path.dirname(demoDataFile), { recursive: true });
    const tempFile = `${demoDataFile}.tmp`;
    await writeFile(tempFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await rename(tempFile, demoDataFile);
  });

  saveQueue = task.catch((error) => {
    logger.warn('Could not save demo data store', { error, file: demoDataFile });
  });

  return task;
}

export function getDemoDataFile(): string {
  return demoDataFile;
}

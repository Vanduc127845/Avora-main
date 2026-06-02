import {
  demoConfidenceEntries,
  type DemoConfidenceEntry,
} from '../data/demo-store.js';
import { saveDemoData } from '../data/demo-persistence.js';
import { getOptionalSupabaseAdmin } from '../utils/supabase.js';

type ConfidenceEntryRow = {
  id: string;
  user_id: string;
  mood: DemoConfidenceEntry['mood'];
  win: string | null;
  blocker: string | null;
  next_step: string | null;
  coach_reply: string | null;
  created_at: string;
};

export type ConfidenceEntryInput = Omit<DemoConfidenceEntry, 'userId'>;

const normalizeRow = (row: ConfidenceEntryRow): DemoConfidenceEntry => ({
  id: row.id,
  userId: row.user_id,
  mood: row.mood,
  win: row.win || '',
  blocker: row.blocker || '',
  nextStep: row.next_step || '',
  coachReply: row.coach_reply || '',
  createdAt: row.created_at,
});

const withoutUserId = ({ userId: _userId, ...entry }: DemoConfidenceEntry) => entry;

export class ConfidenceService {
  async listEntries(userId: string): Promise<ConfidenceEntryInput[]> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('confidence_entries')
        .select('id,user_id,mood,win,blocker,next_step,coach_reply,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row) => withoutUserId(normalizeRow(row as ConfidenceEntryRow)));
    }

    return [...demoConfidenceEntries.values()]
      .filter((entry) => entry.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(withoutUserId);
  }

  async saveEntry(userId: string, entry: ConfidenceEntryInput): Promise<ConfidenceEntryInput> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('confidence_entries')
        .upsert(
          {
            id: entry.id,
            user_id: userId,
            mood: entry.mood,
            win: entry.win,
            blocker: entry.blocker,
            next_step: entry.nextStep,
            coach_reply: entry.coachReply,
            created_at: entry.createdAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('id,user_id,mood,win,blocker,next_step,coach_reply,created_at')
        .single();

      if (error) throw error;
      return withoutUserId(normalizeRow(data as ConfidenceEntryRow));
    }

    demoConfidenceEntries.set(entry.id, { ...entry, userId });
    await saveDemoData();
    return entry;
  }

  async deleteEntry(userId: string, id: string): Promise<boolean> {
    const supabase = getOptionalSupabaseAdmin();

    if (supabase) {
      const { data, error } = await supabase
        .from('confidence_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id');

      if (error) throw error;
      return Boolean(data?.length);
    }

    const entry = demoConfidenceEntries.get(id);
    if (!entry || entry.userId !== userId) return false;
    demoConfidenceEntries.delete(id);
    await saveDemoData();
    return true;
  }
}

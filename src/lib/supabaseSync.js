import { supabase, isSupabaseConfigured } from './supabase';

const BACKUP_TABLE = 'app_backups';

// Debounce utility
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export async function backupToCloud(state) {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured — skipping cloud backup');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from(BACKUP_TABLE)
      .upsert({
        id: 'main_backup',
        state_data: JSON.stringify(state),
        updated_at: new Date().toISOString(),
        device_info: navigator.userAgent,
      }, { onConflict: 'id' });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Cloud backup failed:', error);
    return { success: false, error: error.message };
  }
}

export async function restoreFromCloud() {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from(BACKUP_TABLE)
      .select('state_data, updated_at')
      .eq('id', 'main_backup')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'No backup found' };
      }
      throw error;
    }

    const parsedState = JSON.parse(data.state_data);
    return { success: true, state: parsedState, lastBackup: data.updated_at };
  } catch (error) {
    console.error('Cloud restore failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getLastBackupInfo() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(BACKUP_TABLE)
      .select('updated_at, device_info')
      .eq('id', 'main_backup')
      .single();

    if (error) return null;
    return { lastBackup: data.updated_at, device: data.device_info };
  } catch {
    return null;
  }
}

// Debounced version for auto-sync (saves at most once every 30 seconds)
export const debouncedBackup = debounce(backupToCloud, 30000);

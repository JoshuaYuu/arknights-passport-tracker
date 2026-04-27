import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CHANGELOG_FALLBACK } from '@/lib/version';
import type { ChangelogItem } from '@/types';

export function useChangelog(isAdmin: boolean) {
  const [changelog, setChangelog] = useState<ChangelogItem[]>([]);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [editingChangelog, setEditingChangelog] = useState(false);

  // 加载 changelog（DB 优先，本地 fallback）
  useEffect(() => {
    const loadChangelog = async () => {
      const { data, error } = await supabase
        .from('changelog')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Failed to load changelog from DB, using fallback:', error);
        setChangelog(CHANGELOG_FALLBACK);
        return;
      }
      
      if (data && data.length > 0) {
        setChangelog(data.map(item => ({
          id: item.id,
          version: item.version,
          date: item.date,
          changes: item.changes
        })));
      } else {
        // DB 为空，使用本地 fallback
        setChangelog(CHANGELOG_FALLBACK);
      }
    };
    
    loadChangelog();
  }, []);

  const saveChangelog = useCallback(async (newChangelog: ChangelogItem[]) => {
    if (!isAdmin) return;
    
    try {
      await supabase.rpc('truncate_changelog');
      
      for (let i = 0; i < newChangelog.length; i++) {
        const item = newChangelog[i];
        const { error } = await supabase
          .from('changelog')
          .upsert({
            id: item.id || crypto.randomUUID(),
            version: item.version,
            date: item.date,
            changes: item.changes
          }, {
            onConflict: 'id'
          });
        
        if (error) {
          console.error(`Insert error for item ${i}:`, error);
        }
      }
      
      const { data: verifyData, error: verifyError } = await supabase
        .from('changelog')
        .select('*')
        .order('date', { ascending: false });
      
      if (verifyError) {
        console.error('Verify error:', verifyError);
      } else if (verifyData) {
        setChangelog(verifyData.map(item => ({
          id: item.id,
          version: item.version,
          date: item.date,
          changes: item.changes
        })));
      }
    } catch (err) {
      console.error('Save changelog error:', err);
      alert('保存失败，请检查控制台错误信息');
    }
  }, [isAdmin]);

  return {
    changelog,
    changelogOpen,
    setChangelogOpen,
    editingChangelog,
    setEditingChangelog,
    saveChangelog,
  };
}

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DBUser } from '@/lib/supabase';
import type { Ownership, UserData, StandardBox, SpecialPass } from '@/types';

export function useOwnership(currentUser: DBUser | null) {
  const [userData, setUserData] = useState<UserData>({});

  const loadUserData = useCallback(async (userId: string) => {
    const { data: ownershipData, error } = await supabase
      .from('ownerships')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Failed to load user data:', error);
      return;
    }
    
    const userDataMap: UserData = {};
    ownershipData?.forEach((item: any) => {
      userDataMap[item.character_id] = {
        owned: item.owned,
        count: item.count
      };
    });
    
    setUserData(userDataMap);
  }, []);

  const saveOwnership = useCallback(async (charId: number, ownership: Ownership) => {
    if (!currentUser) return;
    
    const { error } = await supabase
      .from('ownerships')
      .upsert({
        user_id: currentUser.id,
        character_id: charId,
        owned: ownership.owned,
        count: ownership.count,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,character_id'
      });
    
    if (error) {
      console.error('Failed to save ownership:', error);
    }
  }, [currentUser]);

  const toggleOwnership = useCallback(async (charId: number) => {
    const newUserData = { ...userData };
    if (newUserData[charId]) {
      newUserData[charId] = { ...newUserData[charId], owned: !newUserData[charId].owned };
      if (!newUserData[charId].owned) {
        newUserData[charId].count = 0;
      } else if (newUserData[charId].count === 0) {
        newUserData[charId].count = 1;
      }
    } else {
      newUserData[charId] = { owned: true, count: 1 };
    }
    
    setUserData(newUserData);
    await saveOwnership(charId, newUserData[charId]);
  }, [userData, saveOwnership]);

  const updateCount = useCallback(async (charId: number, count: number) => {
    const newUserData = { ...userData };
    newUserData[charId] = { owned: count > 0, count: Math.max(0, count) };
    
    setUserData(newUserData);
    await saveOwnership(charId, newUserData[charId]);
  }, [userData, saveOwnership]);

  const ownAllInBox = useCallback(async (box: StandardBox | SpecialPass) => {
    if (!currentUser) return;
    
    const newUserData = { ...userData };
    const updates: any[] = [];
    
    box.ids.forEach(id => {
      if (id !== null) {
        newUserData[id] = { owned: true, count: 1 };
        updates.push({
          user_id: currentUser.id,
          character_id: id,
          owned: true,
          count: 1,
          updated_at: new Date().toISOString()
        });
      }
    });
    
    setUserData(newUserData);
    
    if (updates.length > 0) {
      const { error } = await supabase
        .from('ownerships')
        .upsert(updates, { onConflict: 'user_id,character_id' });
      
      if (error) {
        console.error('Failed to save batch ownership:', error);
      }
    }
  }, [currentUser, userData]);

  const clearUserData = useCallback(() => {
    setUserData({});
  }, []);

  return {
    userData,
    loadUserData,
    toggleOwnership,
    updateCount,
    ownAllInBox,
    clearUserData,
  };
}

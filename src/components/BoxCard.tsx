import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, CheckSquare } from 'lucide-react';
import { CharacterRow } from './CharacterRow';
import type { StandardBox, UserData } from '@/types';

interface BoxCardProps {
  box: StandardBox;
  userData: UserData;
  onToggle: (id: number) => void;
  onUpdateCount: (id: number, count: number) => void;
  onOwnAll: () => void;
  isLoggedIn: boolean;
}

export function BoxCard({ box, userData, onToggle, onUpdateCount, onOwnAll, isLoggedIn }: BoxCardProps) {
  const [expanded, setExpanded] = useState(false);
  const ownedCount = box.ids.filter(id => id !== null && userData[id]?.owned).length;
  const totalCount = box.ids.filter(id => id !== null).length;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-slate-200">
      <CardHeader 
        className="bg-gradient-to-r from-indigo-50 to-purple-50 py-3 px-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span>通行认证 {box.id}.0</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">{ownedCount}/{totalCount}</Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="p-2">
          <div className="space-y-1">
            {box.characters.map((char, idx) => {
              const charId = box.ids[idx];
              if (!char || charId === null) return null;
              const owned = userData[charId]?.owned || false;
              const count = userData[charId]?.count || 0;
              return (
                <CharacterRow 
                  key={idx}
                  name={char}
                  owned={owned}
                  count={count}
                  onToggle={() => isLoggedIn && onToggle(charId)}
                  onUpdateCount={(c) => isLoggedIn && onUpdateCount(charId, c)}
                  disabled={!isLoggedIn}
                />
              );
            })}
          </div>
          {isLoggedIn && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={(e) => { e.stopPropagation(); onOwnAll(); }}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                一键全拥有
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

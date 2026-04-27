import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, CheckSquare, Star, Music, Users, Gift, Crown, Sparkles } from 'lucide-react';
import { CharacterRow } from './CharacterRow';
import type { SpecialPass, UserData } from '@/types';

interface SpecialCardProps {
  pass: SpecialPass;
  userData: UserData;
  onToggle: (id: number) => void;
  onUpdateCount: (id: number, count: number) => void;
  onOwnAll: () => void;
  isLoggedIn: boolean;
}

export function getSpecialIcon(name: string) {
  if (name.includes('音律联觉')) return <Music className="w-4 h-4" />;
  if (name.includes('嘉年华')) return <Sparkles className="w-4 h-4" />;
  if (name.includes('联动')) return <Users className="w-4 h-4" />;
  if (name.includes('精英')) return <Crown className="w-4 h-4" />;
  if (name.includes('荣誉') || name.includes('设定集')) return <Gift className="w-4 h-4" />;
  return <Star className="w-4 h-4" />;
}

export function getSpecialColor(name: string) {
  if (name.includes('音律联觉')) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (name.includes('嘉年华')) return 'bg-pink-100 text-pink-800 border-pink-200';
  if (name.includes('联动')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (name.includes('精英')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (name.includes('荣誉') || name.includes('设定集')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

export function SpecialCard({ pass, userData, onToggle, onUpdateCount, onOwnAll, isLoggedIn }: SpecialCardProps) {
  const [expanded, setExpanded] = useState(false);
  const ownedCount = pass.ids.filter(id => id !== null && userData[id]?.owned).length;
  const totalCount = pass.ids.filter(id => id !== null).length;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-slate-200">
      <CardHeader 
        className={`py-3 px-4 cursor-pointer ${getSpecialColor(pass.name)}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {getSpecialIcon(pass.name)}
            <span className="truncate">{pass.name}</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs bg-white">{ownedCount}/{totalCount}</Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="p-2">
          <div className="space-y-1">
            {pass.characters.map((char, idx) => {
              const charId = pass.ids[idx];
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

import { CheckCircle2, Circle } from 'lucide-react';

interface CharacterRowProps {
  name: string;
  owned: boolean;
  count: number;
  onToggle: () => void;
  onUpdateCount: (count: number) => void;
  disabled: boolean;
}

export function CharacterRow({ name, owned, count, onToggle, onUpdateCount, disabled }: CharacterRowProps) {
  return (
    <div className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${owned ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
      <button onClick={onToggle} disabled={disabled} className={`flex-shrink-0 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        {owned ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
      </button>
      <span className={`flex-1 text-sm truncate ${owned ? 'text-emerald-700 font-medium' : 'text-slate-700'}`}>{name}</span>
      {owned && (
        <div className="flex items-center gap-1">
          <button onClick={() => onUpdateCount(Math.max(0, count - 1))} disabled={disabled} className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50">-</button>
          <span className="w-8 text-center text-sm font-medium">{count}</span>
          <button onClick={() => onUpdateCount(count + 1)} disabled={disabled} className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50">+</button>
        </div>
      )}
    </div>
  );
}

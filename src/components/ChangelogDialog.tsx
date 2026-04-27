import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import type { ChangelogItem } from '@/types';

interface ChangelogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changelog: ChangelogItem[];
  isAdmin: boolean;
  editingChangelog: boolean;
  setEditingChangelog: (editing: boolean) => void;
  onSave: (changelog: ChangelogItem[]) => void;
}

export function ChangelogDialog({
  open,
  onOpenChange,
  changelog,
  isAdmin,
  editingChangelog,
  setEditingChangelog,
  onSave,
}: ChangelogDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>更新记录</DialogTitle>
            {isAdmin && !editingChangelog && (
              <Button variant="outline" size="sm" onClick={() => setEditingChangelog(true)}>
                编辑
              </Button>
            )}
          </div>
        </DialogHeader>
        
        {editingChangelog && isAdmin ? (
          <ChangelogEditor
            changelog={changelog}
            onSave={(newChangelog) => {
              onSave(newChangelog);
              setEditingChangelog(false);
            }}
            onCancel={() => setEditingChangelog(false)}
          />
        ) : (
          <div className="space-y-4">
            {changelog.length === 0 ? (
              <p className="text-center text-slate-500 py-4">暂无更新记录</p>
            ) : (
              [...changelog].sort((a, b) => {
                const versionA = a.version.replace('v', '').split('.').map(Number);
                const versionB = b.version.replace('v', '').split('.').map(Number);
                for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
                  const numA = versionA[i] || 0;
                  const numB = versionB[i] || 0;
                  if (numB !== numA) return numB - numA;
                }
                return 0;
              }).map((item, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                      {item.version}
                    </Badge>
                    <span className="text-xs text-slate-400">{item.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {item.changes.map((change, cidx) => (
                      <li key={cidx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-indigo-500 mt-1">•</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Changelog Editor
interface ChangelogEditorProps {
  changelog: ChangelogItem[];
  onSave: (changelog: ChangelogItem[]) => void;
  onCancel: () => void;
}

function ChangelogEditor({ changelog, onSave, onCancel }: ChangelogEditorProps) {
  const [items, setItems] = useState<ChangelogItem[]>(changelog.length > 0 ? changelog : [{
    version: 'v1.0.0',
    date: new Date().toISOString().split('T')[0],
    changes: ['']
  }]);

  const addItem = () => {
    setItems([{
      version: '',
      date: new Date().toISOString().split('T')[0],
      changes: ['']
    }, ...items]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ChangelogItem, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  };

  const addChange = (itemIdx: number) => {
    const newItems = [...items];
    newItems[itemIdx].changes.push('');
    setItems(newItems);
  };

  const removeChange = (itemIdx: number, changeIdx: number) => {
    const newItems = [...items];
    newItems[itemIdx].changes = newItems[itemIdx].changes.filter((_, i) => i !== changeIdx);
    setItems(newItems);
  };

  const updateChange = (itemIdx: number, changeIdx: number, value: string) => {
    const newItems = [...items];
    newItems[itemIdx].changes[changeIdx] = value;
    setItems(newItems);
  };

  return (
    <div className="space-y-4">
      <Button onClick={addItem} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        添加版本
      </Button>
      
      {items.map((item, idx) => (
        <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Input 
              value={item.version}
              onChange={(e) => updateItem(idx, 'version', e.target.value)}
              placeholder="版本号 (如: v1.0.0)"
              className="flex-1"
            />
            <Input 
              type="date"
              value={item.date}
              onChange={(e) => updateItem(idx, 'date', e.target.value)}
              className="w-32"
            />
            <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {item.changes.map((change, cidx) => (
              <div key={cidx} className="flex items-center gap-2">
                <Input 
                  value={change}
                  onChange={(e) => updateChange(idx, cidx, e.target.value)}
                  placeholder="更新内容"
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => removeChange(idx, cidx)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button onClick={() => addChange(idx)} variant="ghost" size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              添加更新内容
            </Button>
          </div>
        </div>
      ))}
      
      <div className="flex gap-2">
        <Button onClick={() => onSave(items)} className="flex-1">完成</Button>
        <Button onClick={onCancel} variant="outline">取消</Button>
      </div>
    </div>
  );
}

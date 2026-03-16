import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Search, Box, Star, Music, Users, Gift, Crown, Sparkles, 
  User, CheckCircle2, Circle, Lock, Unlock,
  CheckSquare, LogIn, Shield, Loader2, ChevronDown, ChevronUp,
  Plus, Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sendPasswordEmail, validateEmail } from '@/lib/emailjs';
import { VERSION } from '@/lib/version';
import './App.css';

// ==================== Types ====================
interface StandardBox {
  id: number;
  characters: string[];
  ids: (number | null)[];
}

interface SpecialPass {
  name: string;
  characters: string[];
  ids: (number | null)[];
}

interface Data {
  standard_boxes: StandardBox[];
  special_passes: SpecialPass[];
}

interface Ownership {
  owned: boolean;
  count: number;
}

interface UserData {
  [characterId: number]: Ownership;
}

interface DBUser {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
}

interface ChangelogItem {
  id?: string;
  version: string;
  date: string;
  changes: string[];
}

// ==================== Components ====================
function App() {
  // Data states
  const [data, setData] = useState<Data>({ standard_boxes: [], special_passes: [] });
  const [loading, setLoading] = useState(true);
  
  // User states
  const [currentUser, setCurrentUser] = useState<DBUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData>({});
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [showOwnedOnly, setShowOwnedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [changelog, setChangelog] = useState<ChangelogItem[]>([]);
  const [editingChangelog, setEditingChangelog] = useState(false);

  // Check if current user is admin
  const isAdmin = useMemo(() => {
    return currentUser?.is_admin === true || currentUser?.username === 'admin';
  }, [currentUser]);

  // ==================== Load User Data from Supabase ====================
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

  // ==================== Load Data ====================
  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then((baseData: Data) => {
        setData(baseData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, []);

  // ==================== Auto Login ====================
  useEffect(() => {
    const savedUser = localStorage.getItem('arknights_user');
    if (savedUser) {
      try {
        const user: DBUser = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
        loadUserData(user.id);
      } catch (e) {
        localStorage.removeItem('arknights_user');
      }
    }
  }, [loadUserData]);

  // ==================== Load Changelog ====================
  useEffect(() => {
    const loadChangelog = async () => {
      const { data, error } = await supabase
        .from('changelog')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Failed to load changelog:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setChangelog(data.map(item => ({
          id: item.id,
          version: item.version,
          date: item.date,
          changes: item.changes
        })));
      }
    };
    
    loadChangelog();
  }, []);

  // ==================== Save Changelog ====================
  const saveChangelog = useCallback(async (newChangelog: ChangelogItem[]) => {
    if (!isAdmin) return;
    
    try {
      // 1. 使用 RPC 清空表（更可靠）
      await supabase.rpc('truncate_changelog');
      
      // 2. 插入新记录（使用 upsert 避免重复）
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
      
      // 3. 重新加载确认
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

  // ==================== Logout ====================
  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserData({});
    localStorage.removeItem('arknights_user');
  }, []);

  // ==================== Ownership Functions ====================
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

  // ==================== Render Helpers ====================
  const getSpecialIcon = (name: string) => {
    if (name.includes('音律联觉')) return <Music className="w-4 h-4" />;
    if (name.includes('嘉年华')) return <Sparkles className="w-4 h-4" />;
    if (name.includes('联动')) return <Users className="w-4 h-4" />;
    if (name.includes('精英')) return <Crown className="w-4 h-4" />;
    if (name.includes('荣誉') || name.includes('设定集')) return <Gift className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  const getSpecialColor = (name: string) => {
    if (name.includes('音律联觉')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (name.includes('嘉年华')) return 'bg-pink-100 text-pink-800 border-pink-200';
    if (name.includes('联动')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (name.includes('精英')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (name.includes('荣誉') || name.includes('设定集')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // ==================== Filter Functions ====================
  const filteredBoxes = useMemo(() => {
    let boxes = data.standard_boxes;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      boxes = boxes.filter(box => {
        return box.characters.some(char => char.toLowerCase().includes(query));
      });
    }
    if (showOwnedOnly) {
      boxes = boxes.filter(box => {
        return box.ids.some(id => id !== null && userData[id]?.owned);
      });
    }
    return boxes;
  }, [data.standard_boxes, searchQuery, showOwnedOnly, userData]);

  const filteredSpecial = useMemo(() => {
    let passes = data.special_passes;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      passes = passes.filter(pass => {
        return pass.name.toLowerCase().includes(query) ||
          pass.characters.some(char => char.toLowerCase().includes(query));
      });
    }
    if (showOwnedOnly) {
      passes = passes.filter(pass => {
        return pass.ids.some(id => id !== null && userData[id]?.owned);
      });
    }
    return passes;
  }, [data.special_passes, searchQuery, showOwnedOnly, userData]);

  // ==================== Statistics ====================
  const stats = useMemo(() => {
    const totalChars = data.standard_boxes.reduce((acc, box) => 
      acc + box.ids.filter(id => id !== null).length, 0
    ) + data.special_passes.reduce((acc, sp) => 
      acc + sp.ids.filter(id => id !== null).length, 0
    );
    
    const ownedChars = Object.values(userData).filter(d => d.owned).length;
    const totalCount = Object.values(userData).reduce((acc, d) => acc + d.count, 0);
    
    return { totalChars, ownedChars, totalCount, percentage: totalChars > 0 ? Math.round((ownedChars / totalChars) * 100) : 0 };
  }, [data, userData]);

  // ==================== Loading State ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Box className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900">明日方舟通行证统计</h1>
                    <button 
                      onClick={() => setChangelogOpen(true)}
                      className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors"
                    >
                      {VERSION}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Arknights Pass Collection · 
                    <a 
                      href="https://www.xiaohongshu.com/user/profile/5ed74a200000000001004746" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-600 hover:underline ml-1"
                    >
                      作者小红书
                    </a>
                  </p>
                </div>
              </div>
              
              {/* User Area */}
              <div className="flex items-center gap-2">
                {isLoggedIn && currentUser ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <User className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">{currentUser.username}</span>
                      {isAdmin && (
                        <span title="管理员">
                          <Shield className="w-4 h-4 text-amber-500" />
                        </span>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      <Unlock className="w-4 h-4 mr-1" />
                      退出
                    </Button>
                  </>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700">
                        <Lock className="w-4 h-4 mr-2" />
                        登录 / 注册
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>用户登录</DialogTitle>
                      </DialogHeader>
                      <AuthForm 
                        onLoginSuccess={(user) => {
                          setCurrentUser(user);
                          setIsLoggedIn(true);
                          localStorage.setItem('arknights_user', JSON.stringify(user));
                          loadUserData(user.id);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
            
            {/* Search Row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="搜索干员或盒子..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
              <Button 
                variant={showOwnedOnly ? "default" : "outline"} 
                onClick={() => setShowOwnedOnly(!showOwnedOnly)}
                className="whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                仅看已拥有
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.ownedChars}</div>
              <div className="text-xs text-slate-500">已拥有干员</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalCount}</div>
              <div className="text-xs text-slate-500">通行证总数</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.percentage}%</div>
              <div className="text-xs text-slate-500">收集进度</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.totalChars}</div>
              <div className="text-xs text-slate-500">总干员数</div>
            </CardContent>
          </Card>
        </div>

        {/* Login Warning */}
        {!isLoggedIn && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-amber-800">请先登录以查看和编辑您的拥有记录</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="standard" className="flex items-center gap-2">
              <Box className="w-4 h-4" />
              <span>标准盒子 ({filteredBoxes.length})</span>
            </TabsTrigger>
            <TabsTrigger value="special" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>特殊通行证 ({filteredSpecial.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* 标准盒子 */}
          <TabsContent value="standard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
              {filteredBoxes.map((box) => (
                <BoxCard 
                  key={box.id} 
                  box={box} 
                  userData={userData}
                  onToggle={toggleOwnership}
                  onUpdateCount={updateCount}
                  onOwnAll={() => ownAllInBox(box)}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </div>
            {filteredBoxes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">没有找到匹配的盒子</p>
              </div>
            )}
          </TabsContent>

          {/* 特殊通行证 */}
          <TabsContent value="special">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              {filteredSpecial.map((pass, idx) => (
                <SpecialCard 
                  key={idx} 
                  pass={pass} 
                  userData={userData}
                  onToggle={toggleOwnership}
                  onUpdateCount={updateCount}
                  onOwnAll={() => ownAllInBox(pass)}
                  getSpecialIcon={getSpecialIcon}
                  getSpecialColor={getSpecialColor}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </div>
            {filteredSpecial.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">没有找到匹配的特殊通行证</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-slate-400">
            明日方舟通行证统计 · 数据云端同步
          </p>
        </div>
      </footer>

      {/* Changelog Dialog */}
      <Dialog open={changelogOpen} onOpenChange={setChangelogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>更新记录</DialogTitle>
              {isAdmin && !editingChangelog && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingChangelog(true)}
                >
                  编辑
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {editingChangelog && isAdmin ? (
            <ChangelogEditor 
              changelog={changelog} 
              onSave={(newChangelog) => {
                saveChangelog(newChangelog);
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
                  // 按版本号降序排序（v1.5.0 > v1.4.0 > ...）
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
    </div>
  );
}

// ==================== Changelog Editor Component ====================

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

// ==================== Auth Form Component ====================

interface AuthFormProps {
  onLoginSuccess: (user: DBUser) => void;
}

function AuthForm({ onLoginSuccess }: AuthFormProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .single();

      if (fetchError || !user) {
        setError('用户名或密码错误');
        setLoading(false);
        return;
      }

      if (user.password !== password) {
        setError('用户名或密码错误');
        setLoading(false);
        return;
      }

      onLoginSuccess(user);
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!email.trim()) {
      setError('请输入邮箱');
      return;
    }
    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.trim())
        .single();

      if (existingUser) {
        setError('用户名已存在');
        setLoading(false);
        return;
      }

      const { data: existingEmail } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.trim())
        .single();

      if (existingEmail) {
        setError('该邮箱已被注册');
        setLoading(false);
        return;
      }

      const { error: createError } = await supabase
        .from('users')
        .insert({
          username: username.trim(),
          email: email.trim(),
          password: password,
          is_admin: false
        })
        .select()
        .single();

      if (createError) {
        setError('注册失败，请重试');
        setLoading(false);
        return;
      }

      setSuccess('注册成功！请登录');
      setView('login');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('请输入邮箱地址');
      return;
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (!user) {
        setError('未找到该邮箱对应的用户');
        setLoading(false);
        return;
      }

      // 发送密码到邮箱
      const result = await sendPasswordEmail(user.email, user.username, user.password);
      
      if (result.success) {
        setSuccess('密码已发送到您的邮箱，请查收');
      } else {
        console.error('Send email failed:', result.error);
        setError(`邮件发送失败: ${result.error || '请检查EmailJS配置'}`);
      }
    } catch (err) {
      setError('找回密码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'register') {
    return (
      <div className="space-y-4">
        <div>
          <Label>用户名</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="输入用户名" />
        </div>
        <div>
          <Label>邮箱</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="输入邮箱（用于找回密码）" />
        </div>
        <div>
          <Label>密码</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="输入密码" />
        </div>
        <div>
          <Label>确认密码</Label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="再次输入密码" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-emerald-500">{success}</p>}
        <Button onClick={handleRegister} className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          注册
        </Button>
        <Button variant="ghost" onClick={() => { setView('login'); setError(''); setSuccess(''); }} className="w-full">
          已有账号？去登录
        </Button>
      </div>
    );
  }

  if (view === 'forgot') {
    return (
      <div className="space-y-4">
        <div>
          <Label>邮箱地址</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="输入注册时的邮箱" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && (
          <div className="p-3 rounded text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
            {success}
          </div>
        )}
        <Button onClick={handleForgotPassword} className="w-full" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          找回密码
        </Button>
        <Button variant="ghost" onClick={() => { setView('login'); setError(''); setSuccess(''); setEmail(''); }} className="w-full">
          返回登录
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>用户名</Label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="输入用户名" />
      </div>
      <div>
        <Label>密码</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="输入密码" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button onClick={handleLogin} className="w-full" disabled={loading || !username}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
        登录
      </Button>
      <div className="flex flex-col gap-2">
        <Button variant="ghost" onClick={() => { setView('register'); setError(''); }} className="w-full">
          没有账号？去注册
        </Button>
        <Button variant="ghost" onClick={() => { setView('forgot'); setError(''); }} className="w-full text-slate-500">
          忘记密码？
        </Button>
      </div>
    </div>
  );
}

// ==================== Sub Components ====================

interface BoxCardProps {
  box: StandardBox;
  userData: UserData;
  onToggle: (id: number) => void;
  onUpdateCount: (id: number, count: number) => void;
  onOwnAll: () => void;
  isLoggedIn: boolean;
}

function BoxCard({ box, userData, onToggle, onUpdateCount, onOwnAll, isLoggedIn }: BoxCardProps) {
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

interface SpecialCardProps {
  pass: SpecialPass;
  userData: UserData;
  onToggle: (id: number) => void;
  onUpdateCount: (id: number, count: number) => void;
  onOwnAll: () => void;
  getSpecialIcon: (name: string) => React.ReactNode;
  getSpecialColor: (name: string) => string;
  isLoggedIn: boolean;
}

function SpecialCard({ pass, userData, onToggle, onUpdateCount, onOwnAll, getSpecialIcon, getSpecialColor, isLoggedIn }: SpecialCardProps) {
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

interface CharacterRowProps {
  name: string;
  owned: boolean;
  count: number;
  onToggle: () => void;
  onUpdateCount: (count: number) => void;
  disabled: boolean;
}

function CharacterRow({ name, owned, count, onToggle, onUpdateCount, disabled }: CharacterRowProps) {
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

export default App;

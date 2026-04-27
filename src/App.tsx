import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Box, Star, User, Lock, Unlock, Shield, CheckCircle2 } from 'lucide-react';
import { VERSION } from '@/lib/version';
import { useAuth } from '@/hooks/useAuth';
import { useOwnership } from '@/hooks/useOwnership';
import { useChangelog } from '@/hooks/useChangelog';
import { AuthForm } from '@/components/AuthForm';
import { BoxCard } from '@/components/BoxCard';
import { SpecialCard } from '@/components/SpecialCard';
import { ChangelogDialog } from '@/components/ChangelogDialog';
import type { Data } from '@/types';
import './App.css';

function App() {
  // Data states
  const [data, setData] = useState<Data>({ standard_boxes: [], special_passes: [] });
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [showOwnedOnly, setShowOwnedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');

  // Hooks
  const { currentUser, isLoggedIn, isAdmin, login, logout } = useAuth();
  const { userData, loadUserData, toggleOwnership, updateCount, ownAllInBox, clearUserData } = useOwnership(currentUser);
  const { changelog, changelogOpen, setChangelogOpen, editingChangelog, setEditingChangelog, saveChangelog } = useChangelog(isAdmin);

  // Load data
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

  // Auto-login: load user data
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      loadUserData(currentUser.id);
    }
  }, [isLoggedIn, currentUser, loadUserData]);

  // Filter
  const filteredBoxes = useMemo(() => {
    let boxes = data.standard_boxes;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      boxes = boxes.filter(box => box.characters.some(char => char.toLowerCase().includes(query)));
    }
    if (showOwnedOnly) {
      boxes = boxes.filter(box => box.ids.some(id => id !== null && userData[id]?.owned));
    }
    return boxes;
  }, [data.standard_boxes, searchQuery, showOwnedOnly, userData]);

  const filteredSpecial = useMemo(() => {
    let passes = data.special_passes;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      passes = passes.filter(pass => pass.name.toLowerCase().includes(query) || pass.characters.some(char => char.toLowerCase().includes(query)));
    }
    if (showOwnedOnly) {
      passes = passes.filter(pass => pass.ids.some(id => id !== null && userData[id]?.owned));
    }
    return passes;
  }, [data.special_passes, searchQuery, showOwnedOnly, userData]);

  // Statistics
  const stats = useMemo(() => {
    const totalChars = data.standard_boxes.reduce((acc, box) => acc + box.ids.filter(id => id !== null).length, 0) 
      + data.special_passes.reduce((acc, sp) => acc + sp.ids.filter(id => id !== null).length, 0);
    const ownedChars = Object.values(userData).filter(d => d.owned).length;
    const totalCount = Object.values(userData).reduce((acc, d) => acc + d.count, 0);
    return { totalChars, ownedChars, totalCount, percentage: totalChars > 0 ? Math.round((ownedChars / totalChars) * 100) : 0 };
  }, [data, userData]);

  // Loading state
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

  const handleLogout = () => {
    logout();
    clearUserData();
  };

  const handleLoginSuccess = () => {
    // The useAuth hook already handles state updates
    // loadUserData will be triggered by the useEffect above
  };

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
                    <a href="https://www.xiaohongshu.com/user/profile/5ed74a200000000001004746" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 hover:underline ml-1">
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
                      <AuthForm onLoginSuccess={handleLoginSuccess} />
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
      <ChangelogDialog
        open={changelogOpen}
        onOpenChange={setChangelogOpen}
        changelog={changelog}
        isAdmin={isAdmin}
        editingChangelog={editingChangelog}
        setEditingChangelog={setEditingChangelog}
        onSave={saveChangelog}
      />
    </div>
  );
}

export default App;

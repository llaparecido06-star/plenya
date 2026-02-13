import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Crown, Activity, CheckCircle, Search, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  premium_override: boolean;
  onboarding_completed: boolean;
  life_phase: string | null;
  created_at: string;
}

interface Metrics {
  total_users: number;
  premium_users: number;
  active_users: number;
  onboarded_users: number;
}

const Admin: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  // Check admin access
  useEffect(() => {
    if (authLoading || !user) return;

    const checkAdmin = async () => {
      const { data } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user, authLoading]);

  const fetchMetrics = useCallback(async () => {
    const response = await supabase.functions.invoke('admin-users?action=metrics');
    if (!response.error && response.data) {
      setMetrics(response.data);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const params = new URLSearchParams({ action: 'list', page: page.toString() });
    if (search) params.set('search', search);

    const { data, error } = await supabase.functions.invoke(`admin-users?${params.toString()}`);
    if (!error && data) {
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
    }
    setLoadingUsers(false);
  }, [page, search]);

  useEffect(() => {
    if (isAdmin) {
      fetchMetrics();
      fetchUsers();
    }
  }, [isAdmin, fetchMetrics, fetchUsers]);

  const togglePremium = async (userId: string, currentValue: boolean) => {
    setTogglingId(userId);
    const { data, error } = await supabase.functions.invoke('admin-users?action=toggle-premium', {
      method: 'POST',
      body: { user_id: userId, premium_override: !currentValue },
    });

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar premium', variant: 'destructive' });
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, premium_override: !currentValue } : u));
      fetchMetrics();
      toast({ title: 'Sucesso', description: `Premium ${!currentValue ? 'ativado' : 'desativado'}` });
    }
    setTogglingId(null);
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Acesso Restrito</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Usuárias', value: metrics?.total_users ?? '-', icon: Users, color: 'text-blue-500' },
    { label: 'Premium Ativas', value: metrics?.premium_users ?? '-', icon: Crown, color: 'text-amber-500' },
    { label: 'Ativas (7 dias)', value: metrics?.active_users ?? '-', icon: Activity, color: 'text-green-500' },
    { label: 'Onboarding OK', value: metrics?.onboarded_users ?? '-', icon: CheckCircle, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-background p-4 pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Painel Admin
          </h1>
          <p className="text-sm text-muted-foreground">Gerenciamento de usuárias</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {metricCards.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <m.icon className={`w-8 h-8 ${m.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          className="pl-10"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
      </div>

      {/* Users List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Usuárias ({totalUsers})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma usuária encontrada</p>
          ) : (
            users.map((u) => (
              <motion.div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-medium text-foreground text-sm truncate">
                    {u.full_name || 'Sem nome'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {u.life_phase && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {u.life_phase}
                      </Badge>
                    )}
                    {u.onboarding_completed && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        onboarded
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.premium_override && (
                    <Crown className="w-4 h-4 text-amber-500" />
                  )}
                  <Switch
                    checked={u.premium_override}
                    onCheckedChange={() => togglePremium(u.id, u.premium_override)}
                    disabled={togglingId === u.id}
                  />
                </div>
              </motion.div>
            ))
          )}

          {/* Pagination */}
          {totalUsers > 20 && (
            <div className="flex justify-center gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground self-center">
                Página {page + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * 20 >= totalUsers}
                onClick={() => setPage(p => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;

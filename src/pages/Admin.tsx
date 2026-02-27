import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users, Crown, Activity, CheckCircle, Search, Shield, ArrowLeft, Loader2,
  Trash2, Eye, CreditCard, Calendar, Dumbbell, Utensils, Heart, ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  premium_override: boolean;
  onboarding_completed: boolean;
  life_phase: string | null;
  goal: string | null;
  diet_type: string | null;
  fitness_level: string | null;
  contraceptive_type: string | null;
  last_period_start: string | null;
  last_sign_in_at: string | null;
  created_at: string;
}

interface Metrics {
  total_users: number;
  premium_users: number;
  active_users: number;
  onboarded_users: number;
}

interface SubscriptionInfo {
  subscribed: boolean;
  customer_id: string | null;
  subscriptions: Array<{
    id: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    plan_amount: number;
    plan_currency: string;
    plan_interval: string | null;
    product_id: string | null;
    cancel_at_period_end: boolean;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: string;
  }>;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  canceled: 'bg-red-100 text-red-700',
  past_due: 'bg-amber-100 text-amber-700',
  trialing: 'bg-blue-100 text-blue-700',
  incomplete: 'bg-slate-100 text-slate-700',
  succeeded: 'bg-emerald-100 text-emerald-700',
  requires_payment_method: 'bg-red-100 text-red-700',
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

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

  // Detail drawer
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [loadingSub, setLoadingSub] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    if (!response.error && response.data) setMetrics(response.data);
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
    const { error } = await supabase.functions.invoke('admin-users?action=toggle-premium', {
      method: 'POST',
      body: { user_id: userId, premium_override: !currentValue },
    });
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar premium', variant: 'destructive' });
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, premium_override: !currentValue } : u));
      if (selectedUser?.id === userId) setSelectedUser(prev => prev ? { ...prev, premium_override: !currentValue } : null);
      fetchMetrics();
      toast({ title: 'Sucesso', description: `Premium ${!currentValue ? 'ativado' : 'desativado'}` });
    }
    setTogglingId(null);
  };

  const openUserDetail = async (u: AdminUser) => {
    setSelectedUser(u);
    setSubInfo(null);
    setLoadingSub(true);
    const { data, error } = await supabase.functions.invoke(
      `admin-users?action=user-subscription&email=${encodeURIComponent(u.email)}`
    );
    if (!error && data) setSubInfo(data);
    setLoadingSub(false);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.functions.invoke('admin-users?action=delete-user', {
      method: 'POST',
      body: { user_id: deleteTarget.id },
    });
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao excluir conta', variant: 'destructive' });
    } else {
      toast({ title: 'Conta excluída', description: `${deleteTarget.email} foi removida` });
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      setSelectedUser(null);
      fetchMetrics();
    }
    setDeleting(false);
    setDeleteTarget(null);
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
    { label: 'Total Usuárias', value: metrics?.total_users ?? '-', icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Premium', value: metrics?.premium_users ?? '-', icon: Crown, color: 'bg-amber-100 text-amber-600' },
    { label: 'Ativas (7d)', value: metrics?.active_users ?? '-', icon: Activity, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Onboarded', value: metrics?.onboarded_users ?? '-', icon: CheckCircle, color: 'bg-violet-100 text-violet-600' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Painel Admin
            </h1>
          </div>
          <Badge variant="outline" className="text-xs">
            {totalUsers} usuárias
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metricCards.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}>
                    <m.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{m.value}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{m.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>

        {/* Users List */}
        <div className="space-y-2">
          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nenhuma usuária encontrada</p>
          ) : (
            users.map((u) => (
              <motion.div
                key={u.id}
                className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => openUserDetail(u)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {(u.full_name || u.email)?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {u.full_name || 'Sem nome'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {u.premium_override && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-0">
                        Premium
                      </Badge>
                    )}
                    {u.life_phase && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {u.life_phase}
                      </Badge>
                    )}
                    {u.last_sign_in_at && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Último: {new Date(u.last_sign_in_at).toLocaleDateString('pt-BR')}
                      </Badge>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalUsers > 20 && (
          <div className="flex justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              Pág. {page + 1} de {Math.ceil(totalUsers / 20)}
            </span>
            <Button variant="outline" size="sm" disabled={(page + 1) * 20 >= totalUsers} onClick={() => setPage(p => p + 1)}>
              Próxima
            </Button>
          </div>
        )}
      </div>

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes da Usuária
            </SheetTitle>
          </SheetHeader>

          {selectedUser && (
            <div className="mt-6 space-y-5">
              {/* Basic Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">
                      {(selectedUser.full_name || selectedUser.email)?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedUser.full_name || 'Sem nome'}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-[11px] text-muted-foreground">Cadastro</p>
                    <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-[11px] text-muted-foreground">Último login</p>
                    <p className="font-medium">
                      {selectedUser.last_sign_in_at
                        ? new Date(selectedUser.last_sign_in_at).toLocaleDateString('pt-BR')
                        : 'Nunca'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Profile details */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Perfil</p>
                <div className="space-y-1.5">
                  {[
                    { icon: Heart, label: 'Fase', value: selectedUser.life_phase },
                    { icon: Dumbbell, label: 'Fitness', value: selectedUser.fitness_level },
                    { icon: Utensils, label: 'Dieta', value: selectedUser.diet_type },
                    { icon: Calendar, label: 'Última menstruação', value: selectedUser.last_period_start ? new Date(selectedUser.last_period_start).toLocaleDateString('pt-BR') : null },
                    { icon: Heart, label: 'Contraceptivo', value: selectedUser.contraceptive_type },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{item.label}:</span>
                      <span className="font-medium text-foreground">{item.value || '—'}</span>
                    </div>
                  ))}
                  {selectedUser.goal && (
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Objetivos:</span>
                      <span className="font-medium text-foreground">{selectedUser.goal}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Premium Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium">Premium Override</span>
                </div>
                <Switch
                  checked={selectedUser.premium_override}
                  onCheckedChange={() => togglePremium(selectedUser.id, selectedUser.premium_override)}
                  disabled={togglingId === selectedUser.id}
                />
              </div>

              <Separator />

              {/* Stripe Subscription Info */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Assinatura Stripe
                </p>

                {loadingSub ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : !subInfo ? (
                  <p className="text-sm text-muted-foreground">Não foi possível carregar</p>
                ) : !subInfo.customer_id ? (
                  <div className="p-3 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                    Nenhum cliente Stripe encontrado
                  </div>
                ) : (
                  <>
                    {subInfo.subscriptions.length === 0 ? (
                      <div className="p-3 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                        Sem assinaturas
                      </div>
                    ) : (
                      subInfo.subscriptions.map((sub) => (
                        <div key={sub.id} className="p-3 rounded-xl border space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={`text-xs ${statusColors[sub.status] || 'bg-muted text-muted-foreground'}`}>
                              {sub.status}
                            </Badge>
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(sub.plan_amount, sub.plan_currency)}
                              {sub.plan_interval && `/${sub.plan_interval === 'month' ? 'mês' : 'ano'}`}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p>Período: {new Date(sub.current_period_start).toLocaleDateString('pt-BR')} — {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}</p>
                            {sub.cancel_at_period_end && (
                              <p className="text-red-500 font-medium">⚠️ Cancela no fim do período</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}

                    {/* Recent Payments */}
                    {subInfo.payments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Últimos pagamentos</p>
                        {subInfo.payments.slice(0, 5).map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                            <div>
                              <p className="text-foreground">{formatCurrency(p.amount, p.currency)}</p>
                              <p className="text-xs text-muted-foreground">{new Date(p.created).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <Badge className={`text-[10px] ${statusColors[p.status] || 'bg-muted text-muted-foreground'}`}>
                              {p.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-destructive">Zona de Perigo</p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteTarget(selectedUser)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir esta conta
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a excluir a conta de <strong>{deleteTarget?.email}</strong>.
              </p>
              <p>Todos os dados serão removidos permanentemente. Esta ação é <strong>irreversível</strong>.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie,
  LineChart,
  Line
} from 'recharts';
import { 
  Plus, 
  PlusCircle, 
  MinusCircle, 
  LayoutDashboard, 
  Receipt, 
  Settings, 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  X,
  AlertCircle,
  ChevronRight,
  Info,
  Calendar,
  Filter,
  LogOut,
  Menu,
  Coins,
  Briefcase,
  Home,
  Utensils,
  Car,
  Gamepad2,
  ShoppingBag,
  HeartPulse,
  MoreHorizontal,
  CreditCard,
  PiggyBank
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { useFinanceData } from './useFinanceData';
import { Transaction, TransactionType, Category, cn, Debt } from './types';

const ICON_MAP: Record<string, any> = {
  Coins, Briefcase, TrendingUp, Home, Utensils, Car, Gamepad2, ShoppingBag, HeartPulse, MoreHorizontal
};

export default function App() {
  const { 
    transactions, 
    budgets, 
    alerts, 
    categories, 
    debts,
    addTransaction, 
    deleteTransaction, 
    addDebt,
    deleteDebt,
    payDebt,
    removeAlert 
  } = useFinanceData();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'expenses' | 'debts' | 'transactions' | 'alerts'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Stats calculation
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalDebt = debts.filter(d => d.status === 'active').reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

  // Chart data: Monthly trends (last 6 months)
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const mStart = startOfMonth(d);
    const mEnd = endOfMonth(d);
    const monthTransactions = transactions.filter(t => {
      const date = parseISO(t.date);
      return date >= mStart && date <= mEnd;
    });

    return {
      name: format(d, 'MMM'),
      income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    };
  });

  // Chart data: Category distribution (expenses)
  const categoryData = categories
    .filter(c => c.type === 'expense')
    .map(c => ({
      name: c.name,
      value: transactions
        .filter(t => t.type === 'expense' && t.category === c.name)
        .reduce((sum, t) => sum + t.amount, 0),
      color: c.color
    }))
    .filter(d => d.value > 0);

  return (
    <div className="flex h-screen bg-transparent font-sans text-white overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col z-20"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#38bdf8] rounded-lg flex items-center justify-center text-[#020617] font-bold">W</div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-white">WealthWise</span>}
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Panel de Control" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<TrendingUp size={20} />} 
            label="Ingresos" 
            active={activeTab === 'income'} 
            onClick={() => setActiveTab('income')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<TrendingDown size={20} />} 
            label="Egresos" 
            active={activeTab === 'expenses'} 
            onClick={() => setActiveTab('expenses')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<CreditCard size={20} />} 
            label="Deudas" 
            active={activeTab === 'debts'} 
            onClick={() => setActiveTab('debts')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<Receipt size={20} />} 
            label="Transacciones" 
            active={activeTab === 'transactions'} 
            onClick={() => setActiveTab('transactions')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={
              <div className="relative">
                <Bell size={20} />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </div>
            } 
            label="Alertas" 
            active={activeTab === 'alerts'} 
            onClick={() => setActiveTab('alerts')}
            collapsed={!isSidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-[#E5E5E5]">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <Menu size={20} />
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-white/10 bg-transparent backdrop-blur-sm flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-sm font-medium uppercase tracking-widest text-white/50">
            {activeTab === 'dashboard' ? 'Vista General' : 
             activeTab === 'income' ? 'Gestión de Ingresos' :
             activeTab === 'expenses' ? 'Gestión de Egresos' :
             activeTab === 'debts' ? 'Gestión de Deudas' :
             activeTab === 'transactions' ? 'Todas las Transacciones' : 'Alertas de Seguridad'}
          </h2>
          
          <div className="flex items-center gap-4">
            {activeTab === 'debts' ? (
              <button 
                onClick={() => setIsDebtModalOpen(true)}
                className="px-4 py-2 bg-[#38bdf8]/20 text-[#38bdf8] rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-[#38bdf8]/30 border border-[#38bdf8]/30 transition-colors"
              >
                <PlusCircle size={16} />
                Agregar Deuda
              </button>
            ) : (
              <>
                <button 
                  onClick={() => {
                    setTransactionType('income');
                    setIsAddModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#34d399]/20 text-[#34d399] rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-[#34d399]/30 border border-[#34d399]/30 transition-colors"
                >
                  <PlusCircle size={16} />
                  Agregar Ingreso
                </button>
                <button 
                  onClick={() => {
                    setTransactionType('expense');
                    setIsAddModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#fb7185]/20 text-[#fb7185] rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-[#fb7185]/30 border border-[#fb7185]/30 transition-colors"
                >
                  <MinusCircle size={16} />
                  Agregar Gasto
                </button>
              </>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-8 space-y-8 max-w-7xl mx-auto w-full"
          >
            {activeTab === 'dashboard' && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    label="Saldo Actual" 
                    value={balance} 
                    icon={<Wallet className="text-white/30" />} 
                    variant="neutral"
                  />
                  <StatCard 
                    label="Ingresos" 
                    value={totalIncome} 
                    icon={<TrendingUp className="text-[#34d399]" />} 
                    variant="positive"
                  />
                  <StatCard 
                    label="Egresos" 
                    value={totalExpense} 
                    icon={<TrendingDown className="text-[#fb7185]" />} 
                    variant="negative"
                  />
                  <StatCard 
                    label="Deuda Total" 
                    value={totalDebt} 
                    icon={<CreditCard className="text-amber-500" />} 
                    variant="neutral"
                    colorOverride="text-amber-500"
                  />
                </div>

                {/* Alerts Section in Dashboard */}
                {alerts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-white">Alertas Activas</h3>
                      <button onClick={() => setActiveTab('alerts')} className="text-xs text-[#38bdf8] font-medium hover:underline">Ver Todas</button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {alerts.slice(0, 2).map(alert => (
                        <AlertBadge key={alert.id} alert={alert} onRemove={removeAlert} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <DashboardCard title="Gastos vs Ingresos (6m)">
                    <div className="h-[300px] w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          />
                          <Bar dataKey="income" name="Ingresos" fill="#34d399" radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar dataKey="expense" name="Gastos" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </DashboardCard>

                  <DashboardCard title="Gastos por Categoría">
                    <div className="h-[300px] w-full flex items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="w-1/3 pr-4 space-y-2">
                        {categoryData.map((d, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                            <span className="text-xs font-medium text-white/70 truncate">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DashboardCard>
                </div>

                {/* Recent Transactions */}
                <DashboardCard title="Transacciones Recientes">
                   <TransactionTable transactions={transactions.slice(0, 5)} onDelete={deleteTransaction} />
                   {transactions.length > 5 && (
                     <button 
                       onClick={() => setActiveTab('transactions')}
                       className="w-full py-3 mt-4 text-sm font-medium text-white/50 hover:text-white border-t border-white/5 flex items-center justify-center gap-2 group"
                     >
                       Ver Todas las Transacciones <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                     </button>
                   )}
                </DashboardCard>
              </>
            )}

            {activeTab === 'income' && (
              <DashboardCard title="Gestión de Ingresos" full>
                <div className="mb-6 flex justify-between items-center">
                  <p className="text-white/50 text-sm">Lista de todos tus ingresos registrados.</p>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-white/30">Total Ingresos</p>
                    <p className="text-2xl font-bold text-[#34d399]">${totalIncome.toLocaleString()}</p>
                  </div>
                </div>
                <TransactionTable 
                  transactions={transactions.filter(t => t.type === 'income')} 
                  onDelete={deleteTransaction} 
                />
              </DashboardCard>
            )}

            {activeTab === 'expenses' && (
              <DashboardCard title="Gestión de Egresos" full>
                <div className="mb-6 flex justify-between items-center">
                  <p className="text-white/50 text-sm">Lista de todos tus gastos registrados.</p>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-white/30">Total Gastos</p>
                    <p className="text-2xl font-bold text-[#fb7185]">${totalExpense.toLocaleString()}</p>
                  </div>
                </div>
                <TransactionTable 
                  transactions={transactions.filter(t => t.type === 'expense')} 
                  onDelete={deleteTransaction} 
                />
              </DashboardCard>
            )}

            {activeTab === 'debts' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <StatCard 
                    label="Deuda Pendiente" 
                    value={totalDebt} 
                    icon={<AlertCircle className="text-red-400" />} 
                    variant="neutral"
                  />
                  <StatCard 
                    label="Deudas Pagadas" 
                    value={debts.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.amount, 0)} 
                    icon={<TrendingUp className="text-[#34d399]" />} 
                    variant="positive"
                  />
                  <div className="glass p-8 rounded-[40px] flex flex-col justify-center">
                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50 mb-2">Próximo Vencimiento</p>
                    <p className="text-xl font-bold text-white">
                      {debts.filter(d => d.status === 'active').sort((a,b) => a.dueDate.localeCompare(b.dueDate))[0]?.dueDate || 'Sin deudas'}
                    </p>
                  </div>
                </div>
                
                <DashboardCard title="Mis Deudas" full>
                  <DebtList debts={debts} onDelete={deleteDebt} onPay={payDebt} />
                </DashboardCard>
              </div>
            )}

            {activeTab === 'transactions' && (
              <DashboardCard title="Todas las Transacciones" full>
                <TransactionTable transactions={transactions} onDelete={deleteTransaction} />
              </DashboardCard>
            )}

            {activeTab === 'alerts' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-white">Alertas de Presupuesto y Seguridad</h3>
                    <p className="text-white/50 text-sm mt-1">Mantente informado sobre tu salud financiera y patrones de gasto inusuales.</p>
                  </div>
                  <AlertCircle size={32} className="text-white/20" />
                </div>
                
                {alerts.length === 0 ? (
                  <div className="glass rounded-3xl p-12 text-center border border-dashed border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-white/20">
                      <Bell size={24} />
                    </div>
                    <h4 className="font-semibold text-white">¡Todo en orden!</h4>
                    <p className="text-white/50 text-sm mt-1">No se encontraron alertas para tu cuenta en este momento.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map(alert => (
                      <div 
                        key={alert.id}
                        className={cn(
                          "bg-white rounded-2xl p-6 border-l-4 shadow-sm flex items-start gap-4",
                          alert.type === 'danger' ? 'border-[#fb7185]' : alert.type === 'warning' ? 'border-amber-500' : 'border-[#38bdf8]'
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          alert.type === 'danger' ? 'bg-[#fb7185]/10 text-[#fb7185]' : alert.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-[#38bdf8]/10 text-[#38bdf8]'
                        )}>
                          {alert.type === 'danger' ? <X size={20} /> : alert.type === 'warning' ? <AlertCircle size={20} /> : <Info size={20} />}
                        </div>
                        <div className="flex-1 pr-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-white">{alert.title}</h4>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">{format(parseISO(alert.date), 'MMM d, h:mm a')}</span>
                          </div>
                          <p className="text-white/70 text-sm mt-1 leading-relaxed">{alert.message}</p>
                        </div>
                        <button 
                          onClick={() => removeAlert(alert.id)}
                          className="p-2 hover:bg-white/5 rounded-lg text-white/20 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass rounded-[40px] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold tracking-tight text-white">
                    Agregar {transactionType === 'income' ? 'Ingreso' : 'Gasto'}
                  </h2>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50">
                    <X size={20} />
                  </button>
                </div>

                <TransactionForm 
                  type={transactionType} 
                  categories={categories.filter(c => c.type === transactionType)}
                  onSubmit={(data) => {
                    addTransaction({ ...data, type: transactionType });
                    setIsAddModalOpen(false);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Debt Modal */}
      <AnimatePresence>
        {isDebtModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDebtModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass rounded-[40px] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold tracking-tight text-white">Nueva Deuda</h2>
                  <button onClick={() => setIsDebtModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50">
                    <X size={20} />
                  </button>
                </div>

                <DebtForm 
                  onSubmit={(data) => {
                    addDebt(data);
                    setIsDebtModalOpen(false);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Components
function SidebarItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active ? "bg-white/10 text-white border border-white/20 shadow-lg" : "text-white/50 hover:bg-white/5 hover:text-white"
      )}
    >
      <div className={cn("shrink-0", active ? "text-[#38bdf8]" : "group-hover:text-[#38bdf8]")}>{icon}</div>
      {!collapsed && <span className="font-semibold text-sm">{label}</span>}
    </button>
  );
}

function StatCard({ label, value, icon, variant, colorOverride }: { label: string, value: number, icon: React.ReactNode, variant: 'positive' | 'negative' | 'neutral', colorOverride?: string }) {
  return (
    <div className="glass p-8 rounded-[40px] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 transform group-hover:scale-110 transition-transform">{icon}</div>
      <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50 mb-2">{label}</p>
      <h4 className={cn(
        "text-4xl font-bold tracking-tight",
        colorOverride ? colorOverride : variant === 'positive' ? 'text-[#34d399]' : variant === 'negative' ? 'text-[#fb7185]' : 'text-white'
      )}>
        ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </h4>
    </div>
  );
}

function DashboardCard({ title, children, full }: { title: string, children: React.ReactNode, full?: boolean }) {
  return (
    <div className={cn("glass p-8 rounded-[40px] shadow-sm", full ? "w-full" : "")}>
      <h3 className="font-bold text-lg mb-6 tracking-tight flex items-center gap-2 text-white">
        {title}
      </h3>
      {children}
    </div>
  );
}

interface AlertBadgeProps {
  alert: any;
  onRemove: (id: string) => void;
}

const AlertBadge: React.FC<AlertBadgeProps> = ({ alert, onRemove }) => {
  return (
    <div className={cn(
      "p-4 rounded-2xl border-l-[6px] flex items-start gap-3 relative group backdrop-blur-md",
      alert.type === 'danger' ? 'bg-[#fb7185]/10 border-[#fb7185]' : 'bg-amber-500/10 border-amber-500'
    )}>
      <div className={cn(
        "mt-0.5",
        alert.type === 'danger' ? 'text-[#fb7185]' : 'text-amber-500'
      )}>
        <AlertCircle size={18} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-white">{alert.title}</p>
        <p className="text-xs text-white/70 mt-0.5 line-clamp-1">{alert.message}</p>
      </div>
      <button 
        onClick={() => onRemove(alert.id)}
        className="text-white/30 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function TransactionTable({ transactions, onDelete }: { transactions: Transaction[], onDelete: (id: string) => void }) {
  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-white/30">
        <Receipt size={40} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm italic">No se encontraron transacciones.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5">
            <th className="pb-4 text-[10px] uppercase font-bold tracking-widest text-white/40">Fecha</th>
            <th className="pb-4 text-[10px] uppercase font-bold tracking-widest text-white/40">Categoría</th>
            <th className="pb-4 text-[10px] uppercase font-bold tracking-widest text-white/40">Descripción</th>
            <th className="pb-4 text-[10px] uppercase font-bold tracking-widest text-white/40 text-right">Monto</th>
            <th className="pb-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {transactions.map((t) => (
            <tr key={t.id} className="group hover:bg-white/5 transition-colors">
              <td className="py-4 text-xs font-medium text-white/50">{format(parseISO(t.date), 'MMM d, yyyy')}</td>
              <td className="py-4">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80">
                  {t.category}
                </span>
              </td>
              <td className="py-4 text-sm font-medium text-white truncate max-w-[150px]">{t.description || '-'}</td>
              <td className={cn(
                "py-4 text-sm font-bold text-right",
                t.type === 'income' ? 'text-[#34d399]' : 'text-white'
              )}>
                {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 pl-4 text-right">
                <button 
                  onClick={() => onDelete(t.id)}
                  className="p-1 text-white/20 hover:text-[#fb7185] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DebtForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [interest, setInterest] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    onSubmit({
      name,
      amount: Number(amount),
      interestRate: Number(interest) || 0,
      dueDate,
      category: 'Deuda',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-white">
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Nombre de la Deuda</label>
        <input 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Préstamo Banco"
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 font-medium focus:ring-2 focus:ring-[#38bdf8] outline-none transition-all"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Monto Total</label>
          <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 font-medium focus:ring-2 focus:ring-[#38bdf8] outline-none transition-all"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Interés (%)</label>
          <input 
            type="number"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="0"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 font-medium focus:ring-2 focus:ring-[#38bdf8] outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Fecha de Vencimiento</label>
        <input 
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 font-medium focus:ring-2 focus:ring-[#38bdf8] outline-none transition-all cursor-pointer"
        />
      </div>

      <button 
        type="submit"
        className="w-full py-5 rounded-3xl bg-[#38bdf8] text-[#020617] font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[#38bdf8]/20"
      >
        Guardar Deuda
      </button>
    </form>
  );
}

function DebtList({ debts, onDelete, onPay }: { debts: Debt[], onDelete: (id: string) => void, onPay: (id: string, amount: number) => void }) {
  const [payAmount, setPayAmount] = useState<Record<string, string>>({});

  if (debts.length === 0) {
    return (
      <div className="py-12 text-center text-white/30">
        <CreditCard size={40} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm italic">No tienes deudas registradas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {debts.map(debt => (
        <div key={debt.id} className="bg-white/5 border border-white/10 p-6 rounded-[30px] flex flex-col md:flex-row md:items-center justify-between gap-6 group">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-bold text-xl text-white">{debt.name}</h4>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                debt.status === 'paid' ? "bg-[#34d399]/20 text-[#34d399]" : "bg-amber-500/20 text-amber-500"
              )}>
                {debt.status === 'paid' ? 'Pagada' : 'Activa'}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div>
                <p className="text-[10px] uppercase font-bold text-white/30">Total</p>
                <p className="font-semibold text-white">${debt.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white/30">Pagado</p>
                <p className="font-semibold text-[#34d399]">${debt.paidAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white/30">Pendiente</p>
                <p className="font-semibold text-[#fb7185]">${(debt.amount - debt.paidAmount).toLocaleString()}</p>
              </div>
              {debt.dueDate && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-white/30">Vence</p>
                  <p className="font-semibold text-white/70">{debt.dueDate}</p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-[#34d399] h-full transition-all duration-500" 
                style={{ width: `${Math.min((debt.paidAmount / debt.amount) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {debt.status === 'active' && (
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  placeholder="Monto"
                  value={payAmount[debt.id] || ''}
                  onChange={(e) => setPayAmount({...payAmount, [debt.id]: e.target.value})}
                  className="w-24 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm font-semibold focus:ring-1 focus:ring-[#34d399] outline-none text-white"
                />
                <button 
                  onClick={() => {
                    const amt = Number(payAmount[debt.id]);
                    if (amt > 0) {
                      onPay(debt.id, amt);
                      setPayAmount({...payAmount, [debt.id]: ''});
                    }
                  }}
                  className="bg-[#34d399] text-[#020617] p-2 rounded-xl hover:scale-105 transition-transform"
                >
                  <Plus size={18} />
                </button>
              </div>
            )}
            <button 
              onClick={() => onDelete(debt.id)}
              className="p-2 text-white/20 hover:text-[#fb7185] hover:bg-[#fb7185]/10 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TransactionForm({ type, categories, onSubmit }: { type: TransactionType, categories: Category[], onSubmit: (data: any) => void }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const KEYWORD_MAP: Record<string, string[]> = {
    'Alimentación': ['comida', 'super', 'mercado', 'restaurante', 'cena', 'almuerzo', 'desayuno', 'café', 'starbucks', 'rappi', 'uber eats'],
    'Arriendo': ['renta', 'alquiler', 'arriendo', 'depar', 'apartamento', 'cuota'],
    'Transporte': ['gasolina', 'uber', 'bus', 'metro', 'taxis', 'transporte', 'peaje'],
    'Entretenimiento': ['cine', 'concierto', 'fiesta', 'netflix', 'spotify', 'juegos', 'steam', 'playstation'],
    'Compras': ['ropa', 'zapatos', 'amazon', 'compras', 'mall', 'tienda'],
    'Salud': ['medico', 'farmacia', 'hospital', 'salud', 'dentista', 'clínica', 'gimnasio'],
    'Salario': ['nomina', 'sueldo', 'salario', 'pago'],
    'Freelance': ['cliente', 'proyecto', 'trabajo', 'freelance'],
    'Inversiones': ['dividendos', 'intereses', 'trading', 'crypto', 'acciones'],
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    const lowVal = val.toLowerCase();
    
    // Auto-detect category
    for (const [catName, keywords] of Object.entries(KEYWORD_MAP)) {
      if (keywords.some(k => lowVal.includes(k))) {
        // Only set if category matches the transaction type
        const match = categories.find(c => c.name === catName);
        if (match) {
          setCategory(match.name);
          break;
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    onSubmit({
      amount: Number(amount),
      category: category || 'Otros',
      description,
      date: new Date(date).toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Descripción</label>
        <input 
          type="text"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="¿Para qué fue esto? (ej: Cena con amigos)"
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 font-medium text-lg focus:ring-2 focus:ring-[#38bdf8] outline-none transition-all text-white placeholder:text-white/20"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Monto</label>
        <div className="relative">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/30">$</span>
          <input 
            type="number" 
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 pl-12 pr-8 text-4xl font-bold focus:ring-2 focus:ring-[#38bdf8] outline-none transition-all placeholder:text-white/10 text-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Categoría</label>
          <div className="relative">
            <input 
              type="text"
              list="category-suggestions"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Escribe o elige..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 font-semibold text-sm focus:ring-2 focus:ring-[#38bdf8] outline-none transition-all text-white"
            />
            <datalist id="category-suggestions">
              {categories.map(c => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Fecha</label>
          <input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 font-semibold text-sm focus:ring-2 focus:ring-[#38bdf8] outline-none transition-all cursor-pointer text-white"
          />
        </div>
      </div>

      <button 
        type="submit"
        className={cn(
          "w-full py-5 rounded-3xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all",
          type === 'income' ? 'bg-[#34d399] text-[#020617] shadow-[#34d399]/20' : 'bg-[#38bdf8] text-[#020617] shadow-[#38bdf8]/20'
        )}
      >
        Guardar Transacción
      </button>
    </form>
  );
}

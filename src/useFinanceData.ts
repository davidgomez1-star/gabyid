/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Transaction, Budget, Alert, Category, DEFAULT_CATEGORIES, Debt } from './types';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from 'date-fns';

const STORAGE_KEYS = {
  TRANSACTIONS: 'wealthwise_transactions',
  BUDGETS: 'wealthwise_budgets',
  ALERTS: 'wealthwise_alerts',
  CATEGORIES: 'wealthwise_categories',
  DEBTS: 'wealthwise_debts',
};

export function useFinanceData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const storedBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    const storedAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS);
    const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const storedDebts = localStorage.getItem(STORAGE_KEYS.DEBTS);

    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      setTransactions([]);
    }

    if (storedBudgets) {
      setBudgets(JSON.parse(storedBudgets));
    } else {
      setBudgets([]);
    }

    if (storedDebts) {
      setDebts(JSON.parse(storedDebts));
    } else {
      setDebts([]);
    }

    if (storedAlerts) setAlerts(JSON.parse(storedAlerts));
    if (storedCategories) setCategories(JSON.parse(storedCategories));
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
    }
  }, [transactions, budgets, alerts, categories, debts, isLoaded]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);

    // Run intelligent validation
    checkAlerts(newTransaction, updatedTransactions, budgets);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const addDebt = (debt: Omit<Debt, 'id' | 'paidAmount' | 'status'>) => {
    const newDebt: Debt = {
      ...debt,
      id: Math.random().toString(36).substr(2, 9),
      paidAmount: 0,
      status: 'active',
    };
    setDebts([newDebt, ...debts]);
  };

  const deleteDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  const payDebt = (id: string, amount: number) => {
    setDebts(prev => prev.map(d => {
      if (d.id === id) {
        const newPaid = d.paidAmount + amount;
        return {
          ...d,
          paidAmount: newPaid,
          status: newPaid >= d.amount ? 'paid' : 'active'
        };
      }
      return d;
    }));

    // Register transaction as expense
    const db = debts.find(d => d.id === id);
    if (db) {
      addTransaction({
        type: 'expense',
        amount,
        category: 'Deudas',
        description: `Pago de deuda: ${db.name}`,
        date: new Date().toISOString(),
      });
    }
  };

  const updateBudget = (category: string, limit: number) => {
    setBudgets(prev => {
      const existing = prev.find(b => b.category === category);
      if (existing) {
        return prev.map(b => b.category === category ? { ...b, limit } : b);
      }
      return [...prev, { category, limit, spent: 0 }];
    });
  };

  const checkAlerts = (newT: Transaction, allT: Transaction[], currentBudgets: Budget[]) => {
    if (newT.type === 'expense') {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // 1. Budget Deviation Alert
      const categoryBudget = currentBudgets.find(b => b.category === newT.category);
      if (categoryBudget) {
        const monthExpenses = allT
          .filter(t => 
            t.type === 'expense' && 
            t.category === newT.category && 
            isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
          )
          .reduce((sum, t) => sum + t.amount, 0);

        if (monthExpenses > categoryBudget.limit) {
          addAlert({
            type: 'danger',
            title: `Presupuesto Excedido: ${newT.category}`,
            message: `Has gastado $${monthExpenses.toFixed(2)} lo cual excede tu presupuesto de $${categoryBudget.limit.toFixed(2)}.`,
          });
        } else if (monthExpenses > categoryBudget.limit * 0.8) {
          addAlert({
            type: 'warning',
            title: `Advertencia de Presupuesto: ${newT.category}`,
            message: `Has utilizado el 80% de tu presupuesto de $${categoryBudget.limit.toFixed(2)} para ${newT.category}.`,
          });
        }
      }

      // 2. High spending alert compared to average
      const previousExpenses = allT.filter(t => t.type === 'expense' && t.category === newT.category && t.id !== newT.id);
      if (previousExpenses.length > 3) {
        const avg = previousExpenses.reduce((sum, t) => sum + t.amount, 0) / previousExpenses.length;
        if (newT.amount > avg * 1.5) {
          addAlert({
            type: 'info',
            title: `Gasto Inusual en ${newT.category}`,
            message: `Este gasto ($${newT.amount.toFixed(2)}) es un 50% superior a tu promedio en esta categoría ($${avg.toFixed(2)}).`,
          });
        }
      }

      // 3. Low savings alert
      const totalIncome = allT.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = allT.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const balance = totalIncome - totalExpense;
      if (balance < 100 && balance > 0) {
        addAlert({
          type: 'warning',
          title: 'Alerta de Saldo Bajo',
          message: 'Tu saldo actual es inferior a $100. Considera revisar tus próximos gastos.',
        });
      }
    }
  };

  const addAlert = (alert: Omit<Alert, 'id' | 'date'>) => {
    const newAlert: Alert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 10)); // Keep last 10 alerts
  };

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return {
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
    updateBudget,
    removeAlert,
  };
}

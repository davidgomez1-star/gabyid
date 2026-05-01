/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type TransactionType = 'income' | 'expense';

export interface Debt {
  id: string;
  name: string;
  amount: number;
  paidAmount: number;
  interestRate: number;
  dueDate: string;
  category: string;
  status: 'active' | 'paid';
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface Budget {
  category: string;
  limit: number;
  spent: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  date: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Salario', type: 'income', color: '#34d399', icon: 'Coins' },
  { id: '2', name: 'Freelance', type: 'income', color: '#38bdf8', icon: 'Briefcase' },
  { id: '3', name: 'Inversiones', type: 'income', color: '#a78bfa', icon: 'TrendingUp' },
  { id: '4', name: 'Alimentación', type: 'expense', color: '#fb7185', icon: 'Utensils' },
  { id: '5', name: 'Arriendo', type: 'expense', color: '#fcd34d', icon: 'Home' },
  { id: '6', name: 'Transporte', type: 'expense', color: '#818cf8', icon: 'Car' },
  { id: '7', name: 'Entretenimiento', type: 'expense', color: '#f472b6', icon: 'Gamepad2' },
  { id: '8', name: 'Compras', type: 'expense', color: '#a78bfa', icon: 'ShoppingBag' },
  { id: '9', name: 'Salud', type: 'expense', color: '#34d399', icon: 'HeartPulse' },
  { id: '10', name: 'Otros', type: 'expense', color: '#94a3b8', icon: 'MoreHorizontal' },
];

import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  company_id: string;
  customer_number: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  street: string | null;
  zip: string | null;
  city: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface QuoteItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface Quote {
  id: string;
  company_id: string;
  customer_id: string;
  created_by: string;
  quote_number: string;
  title: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  vat_amount: number;
  total: number;
  quote_date: string;
  valid_until: string | null;
  items: QuoteItem[];
  notes: string | null;
  created_at: string;
  customer?: Customer;
}

export interface Invoice {
  id: string;
  company_id: string;
  customer_id: string;
  quote_id: string | null;
  created_by: string;
  invoice_number: string;
  title: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  vat_amount: number;
  total: number;
  invoice_date: string;
  due_date: string | null;
  paid_date: string | null;
  items: QuoteItem[];
  notes: string | null;
  created_at: string;
  customer?: Customer;
}

export interface Service {
  id: string;
  company_id: string;
  service_number: string;
  title: string;
  description: string | null;
  unit: string;
  unit_price: number;
  vat_rate: number;
  is_active: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getCustomerName(customer: Customer | undefined): string {
  if (!customer) return '—';
  if (customer.company_name) return customer.company_name;
  return [customer.first_name, customer.last_name].filter(Boolean).join(' ') || '—';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Entwurf', sent: 'Gesendet', accepted: 'Angenommen',
    rejected: 'Abgelehnt', expired: 'Abgelaufen',
    paid: 'Bezahlt', overdue: 'Überfällig', cancelled: 'Storniert',
  };
  return labels[status] ?? status;
}

export function getStatusColors(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-400',
    sent: 'bg-blue-500/20 text-blue-400',
    accepted: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    expired: 'bg-orange-500/20 text-orange-400',
    paid: 'bg-green-500/20 text-green-400',
    overdue: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-gray-500/20 text-gray-400',
  };
  return colors[status] ?? 'bg-gray-500/20 text-gray-400';
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCustomers() {
  const { userProfile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!userProfile?.company_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', userProfile.company_id)
      .eq('is_active', true)
      .order('company_name', { ascending: true });
    if (error) setError(error.message);
    else setCustomers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userProfile?.company_id]);
  return { customers, loading, error, reload: load };
}

export function useQuotes() {
  const { userProfile } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!userProfile?.company_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('quotes')
      .select('*, customer:customers(*)')
      .eq('company_id', userProfile.company_id)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setQuotes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userProfile?.company_id]);
  return { quotes, loading, error, reload: load };
}

export function useInvoices() {
  const { userProfile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!userProfile?.company_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(*)')
      .eq('company_id', userProfile.company_id)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setInvoices(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userProfile?.company_id]);
  return { invoices, loading, error, reload: load };
}

export function useServices() {
  const { userProfile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!userProfile?.company_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', userProfile.company_id)
      .eq('is_active', true)
      .order('title', { ascending: true });
    if (error) setError(error.message);
    else setServices(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userProfile?.company_id]);
  return { services, loading, error, reload: load };
}

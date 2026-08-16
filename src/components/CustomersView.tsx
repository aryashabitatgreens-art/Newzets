import React, { useState, useEffect } from 'react';
import { Customer, Business } from '../types';
import { api } from '../services/api';
import { 
  UserCheck, 
  Search, 
  RefreshCw, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  FileText,
  IndianRupee,
  ChevronRight
} from 'lucide-react';

interface CustomersViewProps {
  activeBusiness: Business | null;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ activeBusiness }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const currencySymbol = activeBusiness?.currency_symbol || '₹';

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers(search);
      setCustomers(res.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#7C8363]"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8363]">Client Relations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#2D2D26]">Customers & Accounts</h1>
          <p className="text-xs text-[#8A8A7C] mt-1">
            Manage active client accounts, lifetime values, proposals, and interaction history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCustomers}
            className="p-2.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-[#7C8363] hover:bg-[#F2F4EC] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-[#E8E2D9] shadow-xs">
        <form 
          onSubmit={(e) => { e.preventDefault(); loadCustomers(); }} 
          className="relative max-w-md"
        >
          <Search className="w-4 h-4 text-[#8A8A7C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, company, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-xs text-[#2D2D26] placeholder-[#8A8A7C] focus:outline-hidden focus:border-[#7C8363]"
          />
        </form>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#8A8A7C]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#7C8363]" />
            Loading customers database...
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#F2F4EC] text-[#7C8363] flex items-center justify-center mx-auto mb-3 border border-[#D5DAC7]">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif font-semibold text-[#2D2D26]">No Customers Yet</h3>
            <p className="text-xs text-[#8A8A7C] max-w-sm mx-auto mt-1">
              Convert high-intent CRM leads to create your first client account.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#8A8A7C] border-b border-[#E8E2D9] uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Customer Name</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Lifetime Value</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]/60">
                {customers.map((c) => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-[#FAF8F5]/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[#FAF5EC] text-[#C9A66B] font-serif font-bold text-xs flex items-center justify-center border border-[#EADBCE]">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[#2D2D26]">{c.name}</div>
                          <div className="text-[11px] text-[#8A8A7C]">{c.email || 'No email provided'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-[#2D2D26]">
                      {c.company || 'Direct Client'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F2F4EC] text-[#7C8363] border border-[#D5DAC7]">
                        {c.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-serif font-bold text-[#2D2D26]">
                      {currencySymbol} {(Number(c.lifetime_value) || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-[#8A8A7C]">
                      {c.city ? `${c.city}, ${c.state || ''}` : 'India'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3 py-1.5 rounded-full bg-[#FAF8F5] hover:bg-[#F2EDE4] text-xs font-semibold text-[#2D2D26] transition-colors"
                      >
                        View Account
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-[#2D2D26]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#E8E2D9] shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D9]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8363]">Account Dossier</span>
                <h2 className="text-xl font-serif font-bold text-[#2D2D26]">{selectedCustomer.name}</h2>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-[#8A8A7C] hover:text-[#2D2D26] p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D9]">
                <div>
                  <span className="text-[#8A8A7C] text-[10px] uppercase font-bold block">Company</span>
                  <span className="font-semibold text-[#2D2D26]">{selectedCustomer.company || 'Individual Client'}</span>
                </div>
                <div>
                  <span className="text-[#8A8A7C] text-[10px] uppercase font-bold block">Lifetime Revenue</span>
                  <span className="font-serif font-bold text-[#2D2D26] text-sm">
                    {currencySymbol} {(Number(selectedCustomer.lifetime_value) || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#8A8A7C] text-[10px] uppercase font-bold block">Phone</span>
                  <span className="text-[#2D2D26]">{selectedCustomer.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#8A8A7C] text-[10px] uppercase font-bold block">Email</span>
                  <span className="text-[#2D2D26]">{selectedCustomer.email || 'N/A'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F2F4EC] border border-[#D5DAC7]">
                <span className="font-serif font-bold text-[#555C42] block mb-1">Customer Activity Timeline</span>
                <p className="text-[11px] text-[#555C42] leading-relaxed">
                  Account synchronized with active proposals, recurring invoices, and customer support logs.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E8E2D9] flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-full bg-[#7C8363] text-white text-xs font-medium hover:bg-[#6B7154]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

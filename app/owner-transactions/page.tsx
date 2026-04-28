"use client";

import { useEffect, useState } from "react";
import { Wallet, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAppContext } from "@/context/AppContext";

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function OwnerTransactionsPage() {
  const { userInfo } = useAppContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userInfo?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('owner_id', userInfo.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [userInfo?.id]);

  return (
    <main className="flex-1 pb-24 h-full bg-background flex flex-col px-6 pt-14">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold flex items-center gap-2">Transactions</h2>
        <p className="text-muted-foreground text-sm font-medium mt-1">View your past earnings and platform payouts.</p>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading transactions...</p>
        </div>
      ) : transactions.length > 0 ? (
        <div className="flex-1 flex flex-col gap-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${tx.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}>
                  {tx.status === 'completed' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    {tx.status === 'completed' ? 'Payment Received' : 'Pending Payment'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-lg text-foreground">₹{tx.amount.toFixed(2)}</p>
                <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${tx.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {tx.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 bg-muted/30 rounded-full mb-4 border border-border shadow-sm flex items-center justify-center">
            <Wallet size={32} className="text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No transactions yet</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-[250px] mx-auto">
            When drivers book your parking spot, your earnings will appear here securely.
          </p>
        </div>
      )}
    </main>
  );
}

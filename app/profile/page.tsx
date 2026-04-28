"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ShieldCheck, User as UserIcon, LogOut, LifeBuoy, ArrowUpRight, ArrowDownLeft, Wallet, CheckCircle2, Building, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { role, toggleRole, userInfo, logout } = useAppContext();
  const router = useRouter();

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<"bank" | "upi">("bank");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const mockTransactions = [
    { id: 'tx-1', type: 'credit', title: 'Credited to Wallet', amount: 500.00, date: 'Oct 01, 2023', description: 'Platform payout' },
    { id: 'tx-2', type: 'debit', title: 'Paid for Parking', amount: 150.00, date: 'Sep 28, 2023', description: 'At Nexus Mall' },
    { id: 'tx-3', type: 'debit', title: 'Debited to Bank', amount: 1000.00, date: 'Sep 25, 2023', description: 'Withdrawal' },
    { id: 'tx-4', type: 'credit', title: 'Wallet Top-up', amount: 300.00, date: 'Sep 20, 2023', description: 'Via UPI' },
  ];

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setWithdrawModalOpen(false);
      // Simulate toast
      toast.success("Withdrawal request submitted! Amount will reflect in 24-48 hours.");
    }, 1500);
  };

  return (
    <main className="flex-1 pb-24 h-full bg-background flex flex-col px-6">
      {/* User Header */}
      <div className="p-6 pt-14 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full mb-4 border-[3px] border-primary shadow-[0_0_20px_rgba(0,102,255,0.3)] flex items-center justify-center relative">
          <span className="text-primary font-black text-3xl">{userInfo?.name?.charAt(0).toUpperCase() || "U"}</span>
          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-background shadow-lg">
            <ShieldCheck size={12} className="text-background" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{session?.user?.user_metadata?.full_name || userInfo?.name || "User"}</h2>
        <p className="text-sm text-muted-foreground font-medium mt-1">{session?.user?.email || userInfo?.email}</p>
        <div className="mt-3 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
          <span className="text-xs font-bold text-primary tracking-wider uppercase">{role}</span>
        </div>
      </div>

      <div className="flex-1 mt-6">
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-xl mb-4 text-foreground">Profile Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-muted-foreground font-medium">Name</span>
                <span className="font-bold">{session?.user?.user_metadata?.full_name || userInfo?.name || "User"}</span>
              </div>
              {/* Payment Method and Saved Vehicles sections are hidden natively until fully integrated */}
            </div>
          </div>
        </div>

        {/* Transaction Details Wallet */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-xl text-foreground flex items-center gap-2">
              <Wallet className="text-primary" size={20} /> Wallet Activity
            </h3>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
            {role === 'owner' && (
              <div className="pb-4 border-b border-border flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Available to Withdraw</p>
                  <p className="text-2xl font-black text-foreground drop-shadow-sm">₹1,850.00</p>
                </div>
                <Button 
                  onClick={() => setWithdrawModalOpen(true)}
                  className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 font-bold"
                >
                  Redeem Earnings
                </Button>
              </div>
            )}

            {mockTransactions.map((tx, index) => (
              <div key={tx.id} className={`flex items-center justify-between ${index !== mockTransactions.length - 1 ? 'border-b border-border pb-4' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${tx.type === 'credit' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    {tx.type === 'credit' ? <ArrowDownLeft size={18} className="text-green-500" /> : <ArrowUpRight size={18} className="text-red-500" />}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>{tx.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tx.date} • {tx.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border w-full flex justify-center pb-6 flex-col items-center gap-4">
        <Button 
          variant="secondary" 
          className="w-full max-w-sm font-bold transition-all h-12 bg-secondary/30 hover:bg-secondary text-foreground border border-border shadow-sm"
          onClick={() => router.push("/support")}
        >
          <LifeBuoy className="mr-2 h-4 w-4 text-primary" /> Help & Support
        </Button>
        <Button 
          variant="outline" 
          className="w-full max-w-sm border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500 font-bold transition-all h-12"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Log Out
        </Button>
      </div>

      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-md">
          <form onSubmit={handleWithdraw}>
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold flex items-center gap-2 text-foreground">
                <ArrowUpRight className="text-primary bg-primary/10 p-1 rounded-full" size={24} /> Withdraw Earnings
              </DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground pt-1">
                Transfer your verified parking earnings secured on our platform directly to your bank.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
                <Button 
                  type="button"
                  variant={withdrawMethod === "bank" ? "default" : "ghost"} 
                  onClick={() => setWithdrawMethod("bank")} 
                  className={`flex-1 font-bold ${withdrawMethod === "bank" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Building size={16} className="mr-2" /> Bank Transfer
                </Button>
                <Button 
                  type="button"
                  variant={withdrawMethod === "upi" ? "default" : "ghost"} 
                  onClick={() => setWithdrawMethod("upi")} 
                  className={`flex-1 font-bold ${withdrawMethod === "upi" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Smartphone size={16} className="mr-2" /> UPI
                </Button>
              </div>

              {withdrawMethod === "bank" ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Account Number</Label>
                    <Input required placeholder="e.g. 3020104050" className="h-12 bg-background font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Re-enter Account Number</Label>
                    <Input required placeholder="Confirm Account Number" className="h-12 bg-background font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">IFSC Code</Label>
                    <Input required placeholder="e.g. HDFC0001234" className="h-12 bg-background font-mono uppercase" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Enter UPI ID</Label>
                    <Input required placeholder="e.g. yourname@okhdfcbank" className="h-12 bg-background" />
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3 mt-4">
                    <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                      UPI processing is inherently faster. Make sure your handle is active and linked to a verified bank account.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWithdrawModalOpen(false)} className="w-full sm:w-auto font-bold h-12">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 transition-all text-md px-6">
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</span>
                ) : "Submit Withdrawal Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

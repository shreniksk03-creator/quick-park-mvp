"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, LifeBuoy, ChevronLeft, AlertTriangle } from "lucide-react";

export default function SupportPage() {
  const { role } = useAppContext();
  const router = useRouter();

  const [issueType, setIssueType] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketId, setTicketId] = useState("");

  const driverOptions = ["Payment Issue", "Spot Not Available", "Navigation Problem", "Other"];
  const ownerOptions = ["Payout Issue", "Driver Overstayed", "Property Damage", "Other"];
  // If homeowner needs payment issue too, let's inject it to be safe, though prompt specifies generic dropdown addition.
  // We'll keep existing flow, but ensure "Payment Issue" can be selected if needed, or trigger on "Payout Issue".
  // The prompt says "Add a Category dropdown if one doesn't exist, including Payment Issue."
  const options = role === "owner" ? [...ownerOptions, "Payment Issue"] : driverOptions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate network request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTicketId(`#QP-${Math.floor(1000 + Math.random() * 9000)}`);
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col px-6 pb-24 relative">
      <div className="pt-14 pb-5 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20 w-full flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </Button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground drop-shadow-sm flex items-center gap-2">
            <LifeBuoy className="text-primary" size={20} /> Help & Support
          </h1>
        </div>
      </div>

      <div className="flex-1 w-full max-w-md mx-auto pt-8">
        {!isSuccess ? (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <h2 className="text-2xl font-extrabold tracking-tight mb-6">How can we help you today?</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Issue Type ({role === "owner" ? "Homeowner" : "Driver"})</Label>
                <select 
                  required
                  value={issueType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setIssueType(e.target.value);
                    setSubCategory(""); // Reset sub-category when issue type changes
                  }}
                  className="w-full h-12 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium"
                >
                  <option value="" disabled>Select an issue...</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {issueType === "Payment Issue" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Sub-Category</Label>
                  <select 
                    required
                    value={subCategory}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSubCategory(e.target.value)}
                    className="w-full h-12 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium border-l-4 border-l-primary"
                  >
                    <option value="" disabled>Select a sub-category...</option>
                    <option value="Amount debited but not reflected">Amount debited but not reflected</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Describe your issue</Label>
                <Textarea 
                  required
                  rows={4}
                  placeholder="Please provide details so we can help you faster..."
                  className="bg-background resize-none font-medium text-sm p-3"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                />
              </div>

              {issueType === "Payment Issue" && subCategory === "Amount debited but not reflected" ? (
                <div className="space-y-4 bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl animate-in fade-in zoom-in-95 mt-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Upload Screenshot: Amount Debited (Bank/UPI)</Label>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      required
                      className="bg-background/50 cursor-pointer text-muted-foreground file:text-primary file:font-bold file:border-0 file:bg-transparent file:mt-0 file:pt-0 pt-2.5 h-12 border-orange-500/30" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Upload Screenshot: App Status (Not Reflected)</Label>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      required
                      className="bg-background/50 cursor-pointer text-muted-foreground file:text-primary file:font-bold file:border-0 file:bg-transparent file:mt-0 file:pt-0 pt-2.5 h-12 border-orange-500/30" 
                    />
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg flex gap-3 items-start mt-4">
                    <AlertTriangle className="text-orange-500 shrink-0 w-5 h-5" />
                    <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                      <strong>Please upload both proofs.</strong> Upon verification, the amount will be refunded to your source account within 3 working days.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Attach Screenshot (Optional)</Label>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    className="bg-background cursor-pointer text-muted-foreground file:text-primary file:font-bold file:border-0 file:bg-transparent file:mt-0 file:pt-0 pt-2.5 h-12" 
                  />
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-md font-bold shadow-[0_4px_20px_rgba(0,102,255,0.4)] transition-all mt-4 relative overflow-hidden"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Submitting...</span>
                ) : "Submit Ticket"}
              </Button>
            </form>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-[0_4px_25px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            
            <h2 className="text-2xl font-extrabold tracking-tight mb-2">Ticket Submitted!</h2>
            <p className="text-muted-foreground font-medium mb-6">
              Our support team will review this shortly.
            </p>
            
            <div className="bg-muted w-full py-4 rounded-xl border border-border/50 mb-8 shadow-inner">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Ticket ID</p>
              <p className="font-mono text-2xl font-black text-foreground">{ticketId}</p>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-12 font-bold border-primary text-primary hover:bg-primary/10 hover:border-primary transition-all shadow-sm"
              onClick={() => router.push("/profile")}
            >
              Back to Profile
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

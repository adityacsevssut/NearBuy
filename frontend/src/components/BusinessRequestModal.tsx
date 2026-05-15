"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, RefreshCw, User, Mail, Phone, Lock, Store, Pill, UtensilsCrossed } from "lucide-react";
import toast from "react-hot-toast";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export default function BusinessRequestModal({ isOpen, onClose, defaultType = "vendor" }: { isOpen: boolean; onClose: () => void; defaultType?: "vendor" | "student" }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [ownerName, setOwnerName] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vendorType, setVendorType] = useState<"food" | "medicine" | "store">("food");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (!ownerMobile || !/^[0-9]{10}$/.test(ownerMobile)) return toast.error("Please enter a valid 10-digit mobile number.");

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/vendor-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName, ownerMobile, ownerEmail, password, vendorType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request.");
      
      setSuccess(true);
      toast.success("Business request submitted successfully!");
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  }

  // Reset state when closing
  const handleClose = () => {
    onClose();
    setTimeout(() => { setSuccess(false); setOwnerName(""); setOwnerMobile(""); setOwnerEmail(""); setPassword(""); }, 500);
  };

  const Input = ({ icon: Icon, id, label, type, value, onChange, ...props }: any) => (
    <div className="relative group">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
      <input
        type={type} id={id} value={value} onChange={onChange}
        className="peer w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 pt-5 pb-2 pl-[42px] text-sm text-gray-800 outline-none focus:bg-white focus:border-orange-500 transition-all placeholder-transparent"
        placeholder={label} {...props}
      />
      <label htmlFor={id} className="absolute left-[42px] top-2 text-[10px] uppercase font-bold text-gray-400 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[10px] peer-focus:text-orange-500 transition-all pointer-events-none">
        {label}
      </label>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={handleClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-[440px] overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white relative z-20">
              <div className="w-9" />
              <h2 className="font-black text-xl text-gray-900 text-center">Start Your Business</h2>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto no-scrollbar">
              {success ? (
                <div className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Request Sent!</h3>
                  <p className="text-gray-500 font-medium">Our manager will review your details and contact you soon.</p>
                  <button onClick={handleClose} className="mt-8 w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors">
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-[13px] text-gray-500 text-center font-medium mb-6">
                    Fill out the form below to submit a request to our {defaultType} partnership program.
                  </p>
                  
                  <Input icon={User} id="br-name" label="Owner Name" type="text" value={ownerName} onChange={(e:any)=>setOwnerName(e.target.value)} required />
                  <Input icon={Phone} id="br-mobile" label="Owner Mobile" type="tel" value={ownerMobile} onChange={(e:any)=>setOwnerMobile(e.target.value)} pattern="[0-9]{10}" required />
                  <Input icon={Mail} id="br-email" label="Owner Email" type="email" value={ownerEmail} onChange={(e:any)=>setOwnerEmail(e.target.value)} required />
                  <Input icon={Lock} id="br-pass" label="Account Password" type="password" value={password} onChange={(e:any)=>setPassword(e.target.value)} required minLength={6} />
                  
                  <div className="pt-2">
                    <label className="text-[12px] uppercase font-bold text-gray-400 mb-2 block ml-1">Business Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "food", icon: UtensilsCrossed, label: "Food" },
                        { id: "medicine", icon: Pill, label: "Medicine" },
                        { id: "store", icon: Store, label: "Store" }
                      ].map((item) => (
                        <button
                          key={item.id} type="button" onClick={() => setVendorType(item.id as any)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                            vendorType === item.id 
                              ? "border-orange-500 bg-orange-50 text-orange-600 shadow-sm" 
                              : "border-gray-100 bg-gray-50 text-gray-500 hover:border-orange-200 hover:bg-orange-50/50"
                          }`}
                        >
                          <item.icon className="w-5 h-5 mb-1" />
                          <span className="text-[11px] font-bold">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit" disabled={loading}
                    className="w-full mt-6 relative py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Submit Request"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

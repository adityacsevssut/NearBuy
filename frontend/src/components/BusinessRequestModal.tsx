"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CheckCircle, RefreshCw,
  User, Mail, Phone, Lock,
  Store, Pill, UtensilsCrossed, School, MapPin
} from "lucide-react";
import toast from "react-hot-toast";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

// ── colour palette per vendor type ──────────────────────────────────────────
const THEME = {
  food: {
    border:   "border-orange-500",
    bg:       "bg-orange-50 dark:bg-orange-500/10",
    text:     "text-orange-600 dark:text-orange-500",
    hoverBorder: "hover:border-orange-200 dark:hover:border-orange-400",
    hoverBg:  "hover:bg-orange-50/50 dark:hover:bg-orange-500/10",
    focus:    "focus:border-orange-500",
    label:    "peer-focus:text-orange-500",
    icon:     "group-focus-within:text-orange-500",
    submit:   "from-orange-500 to-orange-600 shadow-orange-500/30",
    active:   "border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500",
  },
  store: {
    border:   "border-blue-500",
    bg:       "bg-blue-50 dark:bg-blue-500/10",
    text:     "text-blue-600 dark:text-blue-500",
    hoverBorder: "hover:border-blue-200 dark:hover:border-blue-400",
    hoverBg:  "hover:bg-blue-50/50 dark:hover:bg-blue-500/10",
    focus:    "focus:border-blue-500",
    label:    "peer-focus:text-blue-500",
    icon:     "group-focus-within:text-blue-500",
    submit:   "from-blue-500 to-blue-600 shadow-blue-500/30",
    active:   "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500",
  },

};

// ── Input defined OUTSIDE the modal component to avoid remount every render ──
interface InputProps {
  icon: React.ElementType;
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  iconClass: string;
  focusBorderClass: string;
  labelFocusClass: string;
  [key: string]: any;
}

function FormInput({
  icon: Icon, id, label, type, value, onChange,
  iconClass, focusBorderClass, labelFocusClass,
  ...props
}: InputProps) {
  return (
    <div className="relative group">
      <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${iconClass} transition-colors pointer-events-none`} />
      <input
        type={type} id={id} value={value} onChange={onChange}
        className={`peer w-full bg-gray-50 dark:bg-[#151522] border-2 border-gray-100 dark:border-[#2A2A3A] rounded-xl px-4 pt-5 pb-2 pl-[42px] text-sm text-gray-800 dark:text-gray-200 outline-none focus:bg-white dark:focus:bg-[#0D0D17] ${focusBorderClass} transition-all placeholder-transparent`}
        placeholder={label} {...props}
      />
      <label
        htmlFor={id}
        className={`absolute left-[42px] top-2 text-[10px] uppercase font-bold text-gray-400 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[10px] ${labelFocusClass} transition-all pointer-events-none`}
      >
        {label}
      </label>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
export default function BusinessRequestModal({
  isOpen,
  onClose,
  defaultType = "vendor",
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "vendor" | "student";
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName,   setOwnerName]   = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [ownerEmail,  setOwnerEmail]  = useState("");
  const [password,    setPassword]    = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [vendorType,  setVendorType]  = useState<"food" | "store">("food");

  const [serviceCenters, setServiceCenters] = useState<any[]>([]);
  const [serviceCenterId, setServiceCenterId] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch(`${API}/api/public/service-centers`)
        .then(res => res.json())
        .then(data => {
          if (data.serviceCenters) {
            setServiceCenters(data.serviceCenters);
            if (data.serviceCenters.length === 1) {
              setServiceCenterId(data.serviceCenters[0].id);
            }
          }
        })
        .catch(err => console.error("Failed to fetch service centers", err));
    }
  }, [isOpen]);

  const theme = THEME[vendorType];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (!ownerMobile || !/^[0-9]{10}$/.test(ownerMobile))
      return toast.error("Please enter a valid 10-digit mobile number.");
    if (!serviceCenterId)
      return toast.error("Please select a Business Area.");

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/vendor-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          restaurantName, ownerName, ownerMobile, ownerEmail, password, vendorType, 
          requestType: defaultType, collegeName, serviceCenterId
        }),
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

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSuccess(false);
      setRestaurantName(""); setOwnerName(""); setOwnerMobile(""); setOwnerEmail(""); setPassword(""); setCollegeName("");
      if (serviceCenters.length !== 1) setServiceCenterId("");
    }, 500);
  };

  const CATEGORIES = [
    { id: "food",     icon: UtensilsCrossed, label: "Food" },
    { id: "store",    icon: Store,           label: "Store" },
  ] as const;

  const title = defaultType === "student" ? "Register as Student" : "Register as Vendor";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-[#0D0D17] rounded-[2rem] shadow-2xl w-full max-w-[440px] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#2A2A3A] bg-white dark:bg-[#0D0D17] relative z-20">
              <div className="w-9" />
              <h2 className="font-black text-xl text-gray-900 dark:text-gray-100 text-center">{title}</h2>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto no-scrollbar">
              {success ? (
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5"
                  >
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2">Request Sent!</h3>
                  
                  {/* Routing confirmation */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 mb-4 ${theme.border} ${theme.bg}`}>
                    {vendorType === "food" && <UtensilsCrossed className={`w-4 h-4 ${theme.text}`} />}
                    {vendorType === "store" && <Store className={`w-4 h-4 ${theme.text}`} />}
                    <span className={`text-sm font-black ${theme.text} capitalize`}>
                      Sent to {vendorType} Manager
                    </span>
                  </div>

                  <p className="text-gray-500 dark:text-gray-400 font-medium text-sm leading-relaxed max-w-xs mx-auto">
                    Your request has been routed to the <span className={`font-black ${theme.text} capitalize`}>{vendorType} Division Manager</span>. They will review your details and contact you soon.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-7 w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Business type selector (shown first so theme affects inputs) */}
                  <div className="pb-2">
                    <label className="text-[12px] uppercase font-bold text-gray-400 mb-2 block ml-1">
                      Business Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => {
                        const isActive = vendorType === cat.id;
                        const catTheme = THEME[cat.id];
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setVendorType(cat.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                              isActive
                                ? catTheme.active
                                : `border-gray-100 dark:border-[#2A2A3A] bg-gray-50 dark:bg-[#151522] text-gray-500 dark:text-gray-400 ${catTheme.hoverBorder} ${catTheme.hoverBg}`
                            }`}
                          >
                            <cat.icon className="w-5 h-5 mb-1" />
                            <span className="text-[11px] font-bold">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Service Center Dropdown */}
                  <div className="relative group">
                    <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${theme.icon} transition-colors pointer-events-none`} />
                    <select
                      id="br-service-center"
                      value={serviceCenterId}
                      onChange={(e) => setServiceCenterId(e.target.value)}
                      required
                      className={`peer w-full bg-gray-50 dark:bg-[#151522] border-2 border-gray-100 dark:border-[#2A2A3A] rounded-xl px-4 pt-5 pb-2 pl-[42px] text-sm text-gray-800 dark:text-gray-200 outline-none focus:bg-white dark:focus:bg-[#0D0D17] ${theme.focus} transition-all appearance-none cursor-pointer`}
                    >
                      <option value="" disabled hidden></option>
                      {serviceCenters.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name} - {sc.landmark} ({sc.pincode})
                        </option>
                      ))}
                    </select>
                    <label
                      htmlFor="br-service-center"
                      className={`absolute left-[42px] top-2 text-[10px] uppercase font-bold text-gray-400 ${!serviceCenterId ? "top-1/2 -translate-y-1/2 text-sm" : ""} peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[10px] ${theme.label} transition-all pointer-events-none`}
                    >
                      Your Business Area
                    </label>
                  </div>

                  {/* Fields — themed by selected category */}
                  <FormInput
                    icon={Store} id="br-restaurant-name" label={vendorType === "food" ? "Restaurant Name" : "Store Name"}
                    type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)}
                    iconClass={theme.icon} focusBorderClass={theme.focus} labelFocusClass={theme.label}
                    required
                  />

                  <FormInput
                    icon={User}  id="br-name"   label="Owner Name"
                    type="text"  value={ownerName}   onChange={(e) => setOwnerName(e.target.value)}
                    iconClass={theme.icon} focusBorderClass={theme.focus} labelFocusClass={theme.label}
                    required
                  />

                  {defaultType === "student" && (
                    <FormInput
                      icon={School} id="br-college" label="College Name"
                      type="text" value={collegeName} onChange={(e) => setCollegeName(e.target.value)}
                      iconClass={theme.icon} focusBorderClass={theme.focus} labelFocusClass={theme.label}
                      required
                    />
                  )}

                  <FormInput
                    icon={Phone} id="br-mobile" label="Owner Mobile"
                    type="tel"   value={ownerMobile} onChange={(e) => setOwnerMobile(e.target.value)}
                    iconClass={theme.icon} focusBorderClass={theme.focus} labelFocusClass={theme.label}
                    pattern="[0-9]{10}" required
                  />
                  <FormInput
                    icon={Mail}  id="br-email"  label="Owner Email"
                    type="email" value={ownerEmail}  onChange={(e) => setOwnerEmail(e.target.value)}
                    iconClass={theme.icon} focusBorderClass={theme.focus} labelFocusClass={theme.label}
                    required
                  />
                  <FormInput
                    icon={Lock}  id="br-pass"   label="Account Password"
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    iconClass={theme.icon} focusBorderClass={theme.focus} labelFocusClass={theme.label}
                    required minLength={6}
                  />

                  {/* Routing info — shown before submit */}
                  <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${theme.border} ${theme.bg}`}>
                    {vendorType === "food" && <UtensilsCrossed className={`w-4 h-4 ${theme.text} shrink-0`} />}
                    {vendorType === "store" && <Store className={`w-4 h-4 ${theme.text} shrink-0`} />}
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      This request will be sent to the{" "}
                      <span className={`font-black ${theme.text} capitalize`}>{vendorType} Manager</span>{" "}
                      for review and approval.
                    </p>
                  </div>

                  <button
                    type="submit" disabled={loading}
                    className={`w-full relative py-4 rounded-xl bg-gradient-to-r ${theme.submit} text-white font-bold shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center`}
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

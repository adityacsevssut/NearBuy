"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, CheckCircle, RefreshCw, AlertCircle, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

type Flow = "choose" | "pick-user" | "login" | "signup-info" | "signup-otp" | "forgot-email" | "forgot-otp" | "forgot-reset" | "success" | "vendor-login" | "manager-login";

interface Props { isOpen: boolean; onClose: () => void; }

const FloatingInput = ({ theme, icon: Icon, type, id, label, value, onChange, showEye, onEyeClick, isEyeOpen, ...props }: any) => (
  <div className="relative group">
    <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${theme.iconFocus} transition-colors z-10 pointer-events-none`} />
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      className={`peer w-full bg-gray-50/80 border-2 border-gray-100 rounded-xl px-4 pt-5 pb-2 pl-[42px] text-sm text-gray-800 outline-none ${theme.inputBorder} focus:bg-white focus:ring-4 ${theme.inputRing} transition-all placeholder-transparent`}
      placeholder={label}
      {...props}
    />
    <label htmlFor={id} className={`absolute left-[42px] top-2 text-[10px] uppercase font-bold tracking-wider text-gray-400 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[14px] peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider ${theme.labelFocus} transition-all pointer-events-none`}>
      {label}
    </label>
    {showEye && (
      <button type="button" onClick={onEyeClick} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none p-1.5 rounded-lg hover:bg-gray-100 transition-colors z-10">
        {isEyeOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    )}
  </div>
);

export default function LoginModal({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const isEssentials = pathname?.startsWith("/essentials") || false;
  const isMedico = pathname?.startsWith("/medico") || false;
  // Theme: orange for Food, blue for Essentials, emerald for Medico
  const t = isEssentials ? {
    logoText: "text-blue-500",
    inputBorder: "focus:border-blue-500",
    inputRing: "focus:ring-blue-500/10",
    iconFocus: "group-focus-within:text-blue-500",
    labelFocus: "peer-focus:text-blue-500",
    btnGrad: "from-blue-500 to-blue-600",
    btnShadow: "shadow-blue-500/30 hover:shadow-blue-500/40",
    otpFocus: "focus:border-blue-500 focus:ring-blue-500/10",
    headerGlow: "from-blue-50/50",
    linkText: "text-blue-600 hover:text-blue-700",
    cardBorder: "border-blue-100",
    panelHover: "hover:border-blue-500 hover:bg-blue-50",
    panelIcon: "bg-blue-100 text-blue-600",
    forgotText: "text-blue-600 hover:text-blue-700",
  } : isMedico ? {
    logoText: "text-emerald-500",
    inputBorder: "focus:border-emerald-500",
    inputRing: "focus:ring-emerald-500/10",
    iconFocus: "group-focus-within:text-emerald-500",
    labelFocus: "peer-focus:text-emerald-500",
    btnGrad: "from-emerald-500 to-emerald-600",
    btnShadow: "shadow-emerald-500/30 hover:shadow-emerald-500/40",
    otpFocus: "focus:border-emerald-500 focus:ring-emerald-500/10",
    headerGlow: "from-emerald-50/50",
    linkText: "text-emerald-600 hover:text-emerald-700",
    cardBorder: "border-emerald-100",
    panelHover: "hover:border-emerald-500 hover:bg-emerald-50",
    panelIcon: "bg-emerald-100 text-emerald-600",
    forgotText: "text-emerald-600 hover:text-emerald-700",
  } : {
    logoText: "text-orange-500",
    inputBorder: "focus:border-orange-500",
    inputRing: "focus:ring-orange-500/10",
    iconFocus: "group-focus-within:text-orange-500",
    labelFocus: "peer-focus:text-orange-500",
    btnGrad: "from-orange-500 to-orange-600",
    btnShadow: "shadow-orange-500/30 hover:shadow-orange-500/40",
    otpFocus: "focus:border-orange-500 focus:ring-orange-500/10",
    headerGlow: "from-orange-50/50",
    linkText: "text-orange-600 hover:text-orange-700",
    cardBorder: "border-orange-100",
    panelHover: "hover:border-orange-500 hover:bg-orange-50",
    panelIcon: "bg-orange-100 text-orange-600",
    forgotText: "text-orange-600 hover:text-orange-700",
  };
  const { login } = useAuth();
  const [flow, setFlow] = useState<Flow>("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Visibility toggles
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");


  // Fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginType, setLoginType] = useState<"food" | "medicine" | "store" | "">("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [forgotEmail, setForgotEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Clear errors and reset flow when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => reset("choose"), 300); // Reset after exit animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  function reset(f: Flow) { setError(""); setOtp(["","","","","",""]); setFlow(f); }

  function handleOtpChange(i: number, v: string) {
    if (!/^\d*$/.test(v)) return;
    const next = [...otp]; next[i] = v.slice(-1);
    setOtp(next);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  }
  
  function handleOtpKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  }
  const otpValue = otp.join("");

  async function post(path: string, body: object) {
    const r = await fetch(`${API}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Something went wrong");
    return data;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const data = await post("login", { email: loginEmail, password: loginPass });
      login(data.user, data.accessToken, data.refreshToken);
      onClose();
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  async function handleVendorLogin(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    if (!loginType) { setError("Please select an Account Type."); setLoading(false); return; }
    try {
      const data = await post("vendor-login", { email: loginEmail, password: loginPass, type: loginType });
      login(data.user, data.accessToken, data.refreshToken);
      window.location.href = "/vendor";
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  async function handleManagerLogin(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    if (!loginType) { setError("Please select an Account Type."); setLoading(false); return; }
    try {
      const data = await post("manager-login", { email: loginEmail, password: loginPass, type: loginType });
      login(data.user, data.accessToken, data.refreshToken);
      window.location.href = "/manager";
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  const passLength = signupPass.length;
  const passStrength = passLength === 0 ? 0 : passLength < 6 ? 1 : passLength < 8 ? 2 : 3;

  const toastStyle = {
    style: {
      border: `1px solid ${isEssentials ? '#3b82f6' : isMedico ? '#10b981' : '#f97316'}`,
      padding: '16px',
      color: isEssentials ? '#3b82f6' : isMedico ? '#10b981' : '#f97316',
      fontWeight: 'bold',
      borderRadius: '12px',
      background: '#fff',
    },
    iconTheme: { primary: isEssentials ? '#3b82f6' : isMedico ? '#10b981' : '#f97316', secondary: '#FFFAEE' },
  };

  async function handleSignupSendOtp(e: React.FormEvent) {
    e.preventDefault(); setError(""); 
    if (signupPass !== confirmPass) return setError("Passwords do not match");
    if (signupPass.length < 8) return setError("Password must be at least 8 characters");
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) return setError("Please enter a valid 10-digit mobile number");

    setLoading(true);
    try {
      await post("send-otp", { email: signupEmail, mobile, purpose: "signup" });
      toast.success("OTP sent to your email 📧", toastStyle);
      reset("signup-otp");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send OTP. Try again.");
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleSignupVerifyOtp(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const data = await post("verify-otp", { email: signupEmail, mobile, otp: otpValue, purpose: "signup" });
      
      const result = await post("signup", {
        firstName, lastName, mobile, email: signupEmail, password: signupPass, verificationToken: data.verificationToken
      });
      
      login(result.user, result.accessToken, result.refreshToken);
      setSuccessMsg(`Welcome to NearBuy, ${result.user.firstName}! 🎉`);
      reset("success");
    } catch (err: any) { 
      setError(err.message || "Invalid OTP code."); 
    }
    setLoading(false);
  }

  async function handleForgotSendOtp(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await post("send-otp", { email: forgotEmail, purpose: "reset" });
      toast.success("Reset code sent! Check your inbox 📧", toastStyle);
      reset("forgot-otp");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset code. Try again.");
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleForgotVerifyOtp(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const data = await post("verify-otp", { email: forgotEmail, otp: otpValue, purpose: "reset" });
      setVerificationToken(data.verificationToken);
      toast.success("Code verified! Set your new password ✅", toastStyle);
      reset("forgot-reset");
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (newPass !== confirmNewPass) return setError("Passwords do not match");
    if (newPass.length < 8) return setError("Password must be at least 8 characters");

    setLoading(true);
    try {
      await post("reset-password", { verificationToken, newPassword: newPass });
      toast.success("Password reset successfully! 🎉", toastStyle);
      setSuccessMsg("Password reset! Please log in with your new password.");
      reset("success");
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  const handleGoogleSuccess = async (tokenResponse: any) => {
    const idToken = tokenResponse.credential;
    if (!idToken) {
      setError("Google sign-in did not return a token.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await post("google", { idToken });
      login(data.user, data.accessToken, data.refreshToken);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const BtnPrimary = ({ children, disabled, type = "submit", onClick }: any) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full relative overflow-hidden py-3.5 rounded-xl bg-gradient-to-r ${t.btnGrad} text-white font-bold text-[15px] shadow-lg ${t.btnShadow} hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 group`}
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
      {loading ? <RefreshCw className="w-5 h-5 animate-spin relative z-10" /> : <span className="relative z-10 flex items-center gap-2 w-full justify-center">{children}</span>}
    </button>
  );

  const GoogleBtn = () => (
    <div className="w-full mt-2 flex justify-center items-center max-w-full overflow-hidden">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => setError("Google sign-in was cancelled or failed.")}
        useOneTap
        shape="rectangular"
        size="large"
        text="continue_with"
        width="280"
      />
    </div>
  );

  const Divider = () => (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200" />
      <span className="text-xs text-gray-400 font-bold tracking-widest uppercase">OR</span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200" />
    </div>
  );

  const ErrorBanner = () => (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-start gap-3 shadow-sm mb-4"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="font-medium leading-tight">{error}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );



  const ModalHeader = ({ title, back }: { title: string; back?: Flow }) => (
    <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white/50 backdrop-blur-md relative z-20">
      {back ? (
        <button onClick={() => reset(back)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      ) : <div className="w-9" />}
      <div className="text-center">
        <span className="font-black text-2xl tracking-tighter">
          <span className={`${t.logoText} drop-shadow-sm`}>Near</span><span className="text-gray-900 drop-shadow-sm">Buy</span>
        </span>
        {/* title intentionally removed */}
      </div>
      <button onClick={onClose} className="p-2 rounded-full hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={e => e.target === e.currentTarget && onClose()}>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-[440px] overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
          >
            {/* Subtle background gradient glow */}
            <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${t.headerGlow} to-transparent pointer-events-none`} />

            {/* ── CHOOSE: 3 panels ── */}
            {flow === "choose" && (
              <>
                <ModalHeader title="" />
                <div className="p-6 sm:p-8 space-y-3 relative z-10 overflow-y-auto no-scrollbar">
                  <p className="text-center text-[13px] text-gray-400 font-semibold uppercase tracking-widest mb-5">Choose account type</p>

                  {/* User Login */}
                  <button
                    onClick={() => reset("pick-user")}
                    className={`w-full p-4 flex items-center gap-4 rounded-lg border border-orange-200/60 bg-orange-50/40 ${t.panelHover} transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5`}
                  >
                    <div className={`w-12 h-12 ${t.panelIcon} rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-start flex-1 text-left">
                      <span className="font-black text-gray-900 text-[16px] group-hover:text-gray-900 transition-colors">User Login</span>
                      <span className="text-[12px] text-gray-400 font-medium mt-0.5">Order food & essentials</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-gray-200 transition-all">
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </button>

                  {/* Vendor Login */}
                  <button
                    onClick={() => reset("vendor-login")}
                    className="w-full p-4 flex items-center gap-4 rounded-lg border border-emerald-200/60 bg-emerald-50/40 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-start flex-1 text-left">
                      <span className="font-black text-gray-900 text-[16px] transition-colors">Vendor Login</span>
                      <span className="text-[12px] text-emerald-600/70 font-medium mt-0.5">Manage your store</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-50/50 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-emerald-200 transition-all">
                      <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </button>

                  {/* Manager Login */}
                  <button
                    onClick={() => reset("manager-login")}
                    className="w-full p-4 flex items-center gap-4 rounded-lg border border-violet-200/60 bg-violet-50/40 hover:border-violet-300 hover:bg-violet-50 transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-start flex-1 text-left">
                      <span className="font-black text-gray-900 text-[16px] transition-colors">Manager Login</span>
                      <span className="text-[12px] text-violet-600/70 font-medium mt-0.5">Admin dashboard</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-violet-50/50 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-violet-200 transition-all">
                      <ChevronRight className="w-4 h-4 text-violet-400 group-hover:text-violet-600 transition-colors" />
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* ── PICK USER: login or signup ── */}
            {flow === "pick-user" && (
              <>
                <ModalHeader title="User Account" back="choose" />
                <div className="p-6 sm:p-8 space-y-4 relative z-10 overflow-y-auto no-scrollbar">
                  <BtnPrimary type="button" disabled={false} onClick={() => reset("login")}>
                    <Mail className="w-4 h-4" /> Log In with Email
                  </BtnPrimary>
                  <div className="pt-1">
                    <GoogleBtn />
                  </div>
                  <Divider />
                  <div className={`text-center bg-gray-50/50 rounded-2xl p-4 border ${t.cardBorder}`}>
                    <p className="text-sm text-gray-600 font-medium">
                      New here?{" "}
                      <button onClick={() => reset("signup-info")} className={`${t.linkText} font-black hover:underline underline-offset-2 transition-colors`}>
                        Create Account
                      </button>
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* ── LOGIN ── */}
            {flow === "login" && (
              <>
                <ModalHeader title="Log in to your account" back="pick-user" />
                <div className="p-6 sm:p-8 relative z-10 overflow-y-auto no-scrollbar">
                  <ErrorBanner />
                  <form onSubmit={handleLogin} className="space-y-4">
                    <FloatingInput theme={t} icon={Mail} type="email" id="login-email" label="Email address" value={loginEmail} onChange={(e:any) => setLoginEmail(e.target.value)} required />
                    
                    <div className="space-y-1.5">
                      <FloatingInput theme={t}
                        icon={Lock} type={showPass ? "text" : "password"} id="login-pass" label="Password" 
                        value={loginPass} onChange={(e:any) => setLoginPass(e.target.value)} required minLength={8}
                        showEye onEyeClick={() => setShowPass(!showPass)} isEyeOpen={showPass} 
                      />
                      <div className="text-right">
                        <button type="button" onClick={() => reset("forgot-email")} className={`text-[13px] ${t.forgotText} font-bold transition-colors`}>
                          Forgot password?
                        </button>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <BtnPrimary>Log In</BtnPrimary>
                    </div>
                  </form>
                  
                  <Divider />
                  <p className="text-center text-[13px] text-gray-500 font-medium">
                    <button type="button" onClick={() => reset("pick-user")} className={`${t.linkText} font-bold hover:underline underline-offset-2`}>
                      Sign in with Google
                    </button>
                  </p>
                  <p className="text-center text-[13px] text-gray-500 font-medium mt-4">
                    Don&apos;t have an account?{" "}
                    <button type="button" onClick={() => reset("signup-info")} className={`${t.linkText} font-bold hover:underline underline-offset-2`}>Sign Up</button>
                  </p>
                </div>
              </>
            )}

            {/* ── SIGNUP STEP 1: Info ── */}
            {flow === "signup-info" && (
              <>
                <ModalHeader title="Create your account" back="pick-user" />
                <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar relative z-10">
                  <ErrorBanner />
                  <form onSubmit={handleSignupSendOtp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FloatingInput theme={t} icon={User} type="text" id="su-first" label="First Name" value={firstName} onChange={(e:any) => setFirstName(e.target.value)} required />
                      <div className="relative group">
                        <input type="text" id="su-last" value={lastName} onChange={(e:any) => setLastName(e.target.value)} required className={`peer w-full bg-gray-50/80 border-2 border-gray-100 rounded-xl px-4 pt-5 pb-2 text-sm text-gray-800 outline-none ${t.inputBorder} focus:bg-white focus:ring-4 ${t.inputRing} transition-all placeholder-transparent`} placeholder="Last Name" />
                        <label htmlFor="su-last" className={`absolute left-4 top-2 text-[10px] uppercase font-bold tracking-wider text-gray-400 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase ${t.labelFocus} transition-all pointer-events-none`}>Last Name</label>
                      </div>
                    </div>
                    
                    <FloatingInput theme={t} icon={Phone} type="tel" id="su-mobile" label="Mobile Number" value={mobile} onChange={(e:any) => setMobile(e.target.value)} pattern="[0-9]{10}" required />
                    <FloatingInput theme={t} icon={Mail} type="email" id="su-email" label="Email address" value={signupEmail} onChange={(e:any) => setSignupEmail(e.target.value)} required />
                    
                    <div className="space-y-2">
                      <FloatingInput theme={t}
                        icon={Lock} type={showPass ? "text" : "password"} id="su-pass" label="Password" 
                        value={signupPass} onChange={(e:any) => setSignupPass(e.target.value)} required minLength={8}
                        showEye onEyeClick={() => setShowPass(!showPass)} isEyeOpen={showPass} 
                      />
                      {/* Password Strength Indicator */}
                      <div className="flex gap-1.5 px-1">
                        {[1,2,3].map((level) => (
                          <div key={level} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            passLength === 0 ? "bg-gray-100" :
                            level <= passStrength ? (
                              passStrength === 1 ? "bg-red-400" :
                              passStrength === 2 ? "bg-amber-400" : "bg-emerald-500"
                            ) : "bg-gray-100"
                          }`} />
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 px-1 font-medium">Use at least 8 characters.</p>
                    </div>

                    <FloatingInput theme={t}
                      icon={Lock} type={showConfirm ? "text" : "password"} id="su-conf" label="Confirm Password" 
                      value={confirmPass} onChange={(e:any) => setConfirmPass(e.target.value)} required minLength={8}
                      showEye onEyeClick={() => setShowConfirm(!showConfirm)} isEyeOpen={showConfirm} 
                    />
                    

                    
                    <div className="pt-2">
                      <BtnPrimary>Send Verification OTP</BtnPrimary>
                    </div>
                  </form>
                  
                  <Divider />
                  <p className="text-center text-[13px] text-gray-500 font-medium">
                    <button type="button" onClick={() => reset("pick-user")} className={`${t.linkText} font-bold hover:underline underline-offset-2`}>
                      Sign in with Google
                    </button>
                  </p>
                  <p className="text-center text-[13px] text-gray-500 font-medium mt-4">
                    Already have an account?{" "}
                    <button type="button" onClick={() => reset("login")} className={`${t.linkText} font-bold hover:underline underline-offset-2`}>Log In</button>
                  </p>
                </div>
              </>
            )}

            {/* ── SIGNUP STEP 2: OTP ── */}
            {flow === "signup-otp" && (
              <>
                <ModalHeader title="Verify your email" back="signup-info" />
                <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar relative z-10">
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 ${t.panelIcon} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Mail className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Check your Email</h3>
                    <p className="text-[13px] text-gray-500 font-medium">We've sent a 6-digit code to</p>
                    <p className="text-sm font-black text-gray-800">{signupEmail}</p>
                  </div>
                  
                  <ErrorBanner />
                  
                  <form onSubmit={handleSignupVerifyOtp}>
                    <div className="flex gap-2.5 justify-center my-6">
                      {otp.map((d, i) => (
                        <input
                          key={i}
                          ref={el => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKey(i, e)}
                          className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-800 outline-none ${t.otpFocus} focus:bg-white focus:ring-4 focus:-translate-y-1 transition-all shadow-sm`}
                        />
                      ))}
                    </div>
                    <BtnPrimary disabled={otpValue.length < 6}>Verify & Create Account</BtnPrimary>
                  </form>
                  
                  <div className="mt-6 text-center">
                    <p className="text-[13px] text-gray-500 font-medium">Didn't receive the email?</p>
                    <button type="button" onClick={() => { setOtp(["","","","","",""]); toast.success("OTP resent to " + signupEmail + " 📧", toastStyle); handleSignupSendOtp({ preventDefault: () => {} } as any); }} className={`text-sm ${t.linkText} font-bold hover:underline underline-offset-2 mt-1`}>
                      Resend OTP
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── FORGOT: Email entry ── */}
            {flow === "forgot-email" && (
              <>
                <ModalHeader title="Reset Password" back="login" />
                <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar relative z-10">
                  <p className="text-[13px] text-gray-500 font-medium text-center mb-6">
                    Enter the email associated with your account and we'll send an OTP to reset your password.
                  </p>
                  <ErrorBanner />
                  <form onSubmit={handleForgotSendOtp} className="space-y-6">
                    <FloatingInput theme={t} icon={Mail} type="email" id="fg-email" label="Email address" value={forgotEmail} onChange={(e:any) => setForgotEmail(e.target.value)} required />
                    <BtnPrimary>Send Reset Code</BtnPrimary>
                  </form>
                </div>
              </>
            )}

            {/* ── FORGOT: OTP verify ── */}
            {flow === "forgot-otp" && (
              <>
                <ModalHeader title="Enter Reset Code" back="forgot-email" />
                <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar relative z-10">
                  <div className="text-center mb-6">
                    <p className="text-[13px] text-gray-500 font-medium">Enter the 6-digit code sent to</p>
                    <p className="text-sm font-black text-gray-800">{forgotEmail}</p>
                  </div>
                  <ErrorBanner />
                  <form onSubmit={handleForgotVerifyOtp}>
                    <div className="flex gap-2.5 justify-center my-6">
                      {otp.map((d, i) => (
                        <input
                          key={i}
                          ref={el => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKey(i, e)}
                          className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-800 outline-none ${t.otpFocus} focus:bg-white focus:ring-4 focus:-translate-y-1 transition-all shadow-sm`}
                        />
                      ))}
                    </div>
                    <BtnPrimary disabled={otpValue.length < 6}>Verify Code</BtnPrimary>
                  </form>
                  <div className="mt-6 text-center">
                    <button type="button" onClick={() => { setOtp(["","","","","",""]); toast.success("Reset code resent! 📧", toastStyle); handleForgotSendOtp({ preventDefault: () => {} } as any); }} className={`text-sm ${t.linkText} font-bold hover:underline underline-offset-2`}>
                      Resend Code
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── FORGOT: Set new password ── */}
            {flow === "forgot-reset" && (
              <>
                <ModalHeader title="Create New Password" back="forgot-otp" />
                <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar relative z-10">
                  <p className="text-[13px] text-gray-500 font-medium text-center mb-6">Your new password must be different from previous used passwords.</p>
                  <ErrorBanner />
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <FloatingInput 
                      icon={Lock} type={showPass ? "text" : "password"} id="fg-pass" label="New Password" 
                      value={newPass} onChange={(e:any) => setNewPass(e.target.value)} required minLength={8}
                      showEye onEyeClick={() => setShowPass(!showPass)} isEyeOpen={showPass} 
                    />
                    <FloatingInput 
                      icon={Lock} type={showConfirm ? "text" : "password"} id="fg-conf" label="Confirm New Password" 
                      value={confirmNewPass} onChange={(e:any) => setConfirmNewPass(e.target.value)} required minLength={8}
                      showEye onEyeClick={() => setShowConfirm(!showConfirm)} isEyeOpen={showConfirm} 
                    />
                    <div className="pt-2">
                      <BtnPrimary>Reset Password</BtnPrimary>
                    </div>
                  </form>
                </div>
              </>
            )}

            {/* ── VENDOR LOGIN ── */}
            {flow === "vendor-login" && (
              <>
                <ModalHeader title="Vendor Login" back="choose" />
                <div className="p-6 sm:p-8 relative z-10 overflow-y-auto no-scrollbar">
                  <ErrorBanner />
                  <form onSubmit={handleVendorLogin} className="space-y-4">
                    <FloatingInput theme={t} icon={Mail} type="email" id="vendor-email" label="Email address" value={loginEmail} onChange={(e:any) => setLoginEmail(e.target.value)} required />
                    
                    <div className="space-y-1.5">
                      <FloatingInput theme={t}
                        icon={Lock} type={showPass ? "text" : "password"} id="vendor-pass" label="Password" 
                        value={loginPass} onChange={(e:any) => setLoginPass(e.target.value)} required minLength={8}
                        showEye onEyeClick={() => setShowPass(!showPass)} isEyeOpen={showPass} 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-black text-gray-700 ml-1">Account Type</label>
                      <div className="flex bg-gray-100/50 p-1 rounded-2xl border border-gray-200">
                        {["food", "medicine", "store"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setLoginType(type as any)}
                            className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl capitalize transition-all ${
                              loginType === type 
                                ? "bg-white shadow-sm text-gray-900 border border-gray-200/50" 
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <BtnPrimary>Log In as Vendor</BtnPrimary>
                    </div>
                  </form>
                </div>
              </>
            )}

            {/* ── MANAGER LOGIN ── */}
            {flow === "manager-login" && (
              <>
                <ModalHeader title="Manager Login" back="choose" />
                <div className="p-6 sm:p-8 relative z-10 overflow-y-auto no-scrollbar">
                  <ErrorBanner />
                  <form onSubmit={handleManagerLogin} className="space-y-4">
                    <FloatingInput theme={t} icon={Mail} type="email" id="manager-email" label="Email address" value={loginEmail} onChange={(e:any) => setLoginEmail(e.target.value)} required />
                    
                    <div className="space-y-1.5">
                      <FloatingInput theme={t}
                        icon={Lock} type={showPass ? "text" : "password"} id="manager-pass" label="Password" 
                        value={loginPass} onChange={(e:any) => setLoginPass(e.target.value)} required minLength={8}
                        showEye onEyeClick={() => setShowPass(!showPass)} isEyeOpen={showPass} 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-black text-gray-700 ml-1">Account Type</label>
                      <div className="flex bg-gray-100/50 p-1 rounded-2xl border border-gray-200">
                        {["food", "medicine", "store"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setLoginType(type as any)}
                            className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl capitalize transition-all ${
                              loginType === type 
                                ? "bg-white shadow-sm text-gray-900 border border-gray-200/50" 
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <BtnPrimary>Log In as Manager</BtnPrimary>
                    </div>
                  </form>
                </div>
              </>
            )}

            {/* ── SUCCESS ── */}
            {flow === "success" && (
              <>
                <ModalHeader title="" />
                <div className="p-6 sm:p-10 flex flex-col items-center text-center overflow-y-auto no-scrollbar relative z-10">
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 relative"
                  >
                    <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping" />
                    <CheckCircle className="w-10 h-10 text-green-500 relative z-10" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Success!</h3>
                  <p className="text-[15px] font-medium text-gray-500 mb-8 max-w-[250px] mx-auto leading-relaxed">{successMsg}</p>
                  <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 hover:-translate-y-0.5 active:scale-95 transition-all shadow-lg shadow-gray-900/20">
                    {successMsg.includes("reset") ? "Go to Login" : "Start Ordering"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


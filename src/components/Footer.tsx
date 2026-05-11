export default function Footer() {
  const links = {
    Product: ["How it Works", "Pricing", "Campus Coverage", "Track Order"],
    Company: ["About Us", "Blog", "Careers", "Press"],
    Partners: ["NearBuy for Business", "Become a Student Runner", "Vendor Portal", "Affiliate Program"],
    Support: ["Help Center", "Contact Us", "Report an Issue", "Refund Policy"],
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">

        {/* CTA Banner */}
        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {/* Runner CTA */}
          <div className="p-6 rounded-2xl bg-gray-800 border border-gray-700 hover:border-emerald-500/40 transition-colors">
            <p className="text-lg font-black text-white mb-1 tracking-tight">
              Become a Student Runner 🏃
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Earn ₹200–₹500/day delivering on campus. Flexible hours, zero commitment.
            </p>
            <button
              id="footer-runner-cta"
              className="btn-emerald px-5 py-2.5 rounded-xl text-white font-bold text-sm"
            >
              Apply Now →
            </button>
          </div>

          {/* Vendor CTA */}
          <div className="p-6 rounded-2xl bg-gray-800 border border-gray-700 hover:border-violet-400/40 transition-colors">
            <p className="text-lg font-black text-white mb-1 tracking-tight">
              NearBuy for Business 🏪
            </p>
            <p className="text-sm text-gray-400 mb-4">
              List your campus stall, canteen, or shop. Reach 3,000+ students instantly.
            </p>
            <button
              id="footer-business-cta"
              className="px-5 py-2.5 rounded-xl text-violet-300 font-bold text-sm
                border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 transition-colors"
            >
              Register as Vendor →
            </button>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
                {category}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-800">
          <div className="flex items-center gap-2">
            {/* Logo removed */}
          </div>
          <p className="text-xs text-gray-600 text-center">
            © 2026 NearBuy Technologies. Made with ❤️ for students of VSSUT Burla.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

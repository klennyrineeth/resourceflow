import { Link } from 'react-router-dom';

export default function Footer({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <footer className={`pb-12 w-full relative overflow-hidden ${fullWidth ? 'pt-8 bg-gray-50/30' : 'pt-16 border-t border-gray-100 bg-white/50'}`}>
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-100/30 rounded-full blur-[80px] -z-10"></div>
      <div className={`${fullWidth ? 'w-full px-6 sm:px-12 lg:px-16' : 'max-w-7xl mx-auto px-6 sm:px-12 lg:px-16'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-12 text-center sm:text-left w-full">
          <Link to="/" className="flex flex-col sm:flex-row items-center sm:items-start gap-3 group">
            <div className="relative">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto opacity-100 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex text-xl sm:text-2xl font-black items-center tracking-tight">
                <span className="text-[#003875]">Resource</span>
                <span className="text-[#009AE5] italic">Flow</span>
              </div>
              <span className="text-[9px] text-blue-600/60 font-black uppercase tracking-[0.4em] antialiased">Community Relief Network</span>
            </div>
          </Link>
          <div className="flex flex-col items-center sm:items-end gap-6 text-center sm:text-right">
            <div className="flex flex-wrap justify-center sm:justify-end gap-6 sm:gap-10">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Operational HQ</p>
                <p className="text-[11px] font-bold text-gray-900 uppercase font-inter">ResourceFlow India</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Platform Status</p>
                <p className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-1.5 justify-center sm:justify-end font-inter">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span> Active Node
                </p>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-200/50 flex flex-col sm:flex-row items-center justify-center md:justify-end gap-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
              <p>© 2026 ResourceFlow.</p>
              <div className="hidden sm:block h-2 w-[1px] bg-gray-300"></div>
              <div className="flex gap-4">
                <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

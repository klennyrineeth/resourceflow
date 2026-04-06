import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Zap,
  Menu,
  ShieldAlert,
  Globe,
  Activity,
  X as CloseIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Button from '../components/UI/Button';
import NewRequestModal from '../components/UI/NewRequestModal';
import Footer from '../components/Layout/Footer';

export default function Landing() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle body scroll locking when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-white font-inter selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">

      {/* BACKGROUND DECORATIONS */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60 animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-blue-100/40 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute top-[40%] right-[10%] w-[20%] h-[20%] bg-purple-50/30 rounded-full blur-[80px]"></div>
      </div>

      <header className={`fixed top-0 inset-x-0 z-[100] transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg border-b border-gray-100 py-2 shadow-sm' : 'bg-transparent py-4'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <img src="/logo.png" alt="ResourceFlow Logo" className="h-8 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105" />
                <div className="absolute -inset-1 bg-blue-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="flex text-xl sm:text-2xl font-black items-center tracking-tight">
                <span className="text-[#003875]">Resource</span>
                <span className="text-[#009AE5] italic">Flow</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <nav className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
                <a href="#teams" className="hover:text-blue-600 transition-colors">Control</a>
                <a href="#network" className="hover:text-blue-600 transition-colors">Network</a>
              </nav>
              <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
                <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-blue-600 transition-colors">
                  Login
                </Link>
                <Link to="/signup">
                  <Button variant="primary" className="h-9 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all border-none">
                    Join The Team
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Icon */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all"
              >
                {isMenuOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-[190] bg-black/5 backdrop-blur-sm transition-opacity duration-500 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
      ></div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-[200] w-[85%] max-w-[400px] bg-white shadow-[-20px_0_80px_rgba(0,0,0,0.2)] transition-all duration-500 ease-in-out md:hidden overflow-hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="relative h-full flex flex-col p-8 sm:p-12">
          <div className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src="/logo.png" alt="Logo" className="h-8 sm:h-10 w-auto object-contain" />
                <div className="absolute -inset-1 bg-blue-400/20 blur-lg rounded-full"></div>
              </div>
              <div className="flex text-xl sm:text-2xl font-black items-center tracking-tight">
                <span className="text-[#003875]">Resource</span>
                <span className="text-[#009AE5] italic">Flow</span>
              </div>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-[#003875] transition-colors bg-gray-50 rounded-lg shadow-sm"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex flex-col gap-6 mb-auto">
            {['Features', 'Control', 'Network'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-black text-[#003875] hover:text-blue-600 transition-all uppercase tracking-[0.2em]"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="mt-auto space-y-3 pt-8 border-t border-gray-100/50">
            <Link to="/login" className="block w-full" onClick={() => setIsMenuOpen(false)}>
              <button className="w-full py-3 text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] bg-gray-50/50 rounded-xl hover:bg-gray-100 transition-colors">
                Sign In
              </button>
            </Link>
            <Link to="/signup" className="block w-full" onClick={() => setIsMenuOpen(false)}>
              <Button variant="primary" className="w-full h-11 font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-xl shadow-blue-500/10 border-none transition-all active:scale-95">
                Join The Team
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <NewRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-12 sm:pt-36 sm:pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#003875] mb-6 leading-[0.95] tracking-tightest">
              Unity in Relief<br />
              <span className="bg-gradient-to-r from-[#009AE5] via-[#3b82f6] to-[#009AE5] bg-clip-text text-transparent animate-gradient-x">Precision in Action.</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-500 mb-10 leading-relaxed px-4 font-medium max-w-2xl mx-auto">
              The intelligent bridge for disaster relief. Connecting local volunteers
              to critical help requests with real-time accuracy and coordinated efforts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button
                variant="primary"
                className="w-full sm:w-auto h-12 sm:h-14 px-8 text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-blue-200 hover:scale-105 transition-all text-white border-none"
                onClick={() => setIsModalOpen(true)}
              >
                Request Help
                <ArrowRight className="ml-2.5 w-4 h-4" />
              </Button>
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full h-12 sm:h-14 px-8 text-xs font-black uppercase tracking-widest rounded-xl border-gray-100 bg-white hover:bg-gray-50 text-[#003875] shadow-sm">
                  Join The Team
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CORE TECH SECTION */}
        <section id="features" className="py-16 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 mb-3">Service Ecosystem</p>
              <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Core Platform Features.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: 'Smart Matching',
                  desc: 'Automatically identifies the most suitable volunteers based on location and current availability for faster response.',
                  color: 'blue'
                },
                {
                  icon: MapPin,
                  title: 'Real-time Tracking',
                  desc: 'A unified map interface connecting volunteer locations with incoming aid requests for complete situational awareness.',
                  color: 'emerald'
                },
                {
                  icon: Activity,
                  title: 'Verified Support',
                  desc: 'Coordinate medical aid, food supplies, and rescue operations through a structured and verified dashboard.',
                  color: 'purple'
                }
              ].map((feat, i) => (
                <Card key={i} className="p-6 border border-gray-100 hover:border-blue-200 transition-all rounded-2xl bg-white/50 backdrop-blur-sm group hover:shadow-xl hover:shadow-blue-100/50">
                  <div className={`w-12 h-12 bg-${feat.color}-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
                    <feat.icon className={`w-6 h-6 text-${feat.color}-600`} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-3 tracking-tight uppercase">{feat.title}</h3>
                  <p className="text-gray-500 text-[13px] leading-relaxed font-medium">{feat.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* MISSION CONTROL PREVIEW */}
        <section id="teams" className="py-24 bg-[#001D3D] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] mb-5">Admin Control Hub</span>
                <h3 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                  The Heart of <br /> Humanitarian <br /><span className="text-blue-400">Coordination.</span>
                </h3>
                <div className="space-y-5">
                  {[
                    'Priority-based help signal sorting',
                    'Verified volunteer onboarding & management',
                    'Live mission monitoring and updates',
                    'Automated notification loops for speed'
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4 text-white/80 group">
                      <div className="p-1 bg-blue-500 rounded-lg group-hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/20"><CheckCircle2 className="w-3 h-3 text-white" /></div>
                      <span className="text-base font-bold tracking-tight">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative group p-2 bg-white/5 rounded-[2.5rem] border-2 border-white/10 shadow-3xl">
                <div className="aspect-[16/10] relative rounded-[2rem] overflow-hidden bg-black/60 shadow-2xl">
                  <img
                    src="/mission_control.png"
                    alt="AI Mission Control Interface"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#001D3D]/60 via-transparent to-transparent"></div>

                  {/* Digital HUD overlays */}
                  <div className="absolute top-6 right-6 flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">LIVE OPS</span>
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-6 p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 animate-in fade-in slide-in-from-left-4 duration-1000 hidden sm:block">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center"><Globe className="w-4 h-4 text-white" /></div>
                      <div>
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none">Active Sectors</p>
                        <p className="text-sm font-black text-white leading-none mt-1">Global Response Ready</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Status Badge - Visible only on small screens */}
                <div className="mt-3 p-3.5 bg-white/5 backdrop-blur-md rounded-xl block sm:hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                      <Globe className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest leading-none mb-1">Operational Status</p>
                      <p className="text-sm font-black text-white leading-none">Global Response Ready</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section id="network" className="py-24 bg-white relative overflow-hidden">
          {/* Decorative background gradients */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/70 rounded-full blur-[140px] -z-10"></div>

          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <ShieldAlert className="w-12 h-12 text-blue-600/20 mx-auto mb-6 animate-bounce" />
            <h3 className="text-3xl sm:text-5xl font-black text-[#003875] mb-6 leading-tight tracking-tightest">
              Join the Future of <br /> Community Relief.
            </h3>
            <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed font-medium">
              ResourceFlow is more than a dashboard. It’s the backbone for community-driven operations where every second counts toward an effective response.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="primary" className="h-14 px-8 text-base font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:scale-105 transition-all w-full border-none">
                  Get Started
                  <ArrowRight className="ml-3 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* CUSTOM STYLE FOR ANIMATIONS */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
        .tracking-tightest { letter-spacing: -0.04em; }
      `}</style>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}


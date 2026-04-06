import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, X, LogOut, User, MapPin, Briefcase, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from './Footer';
import { useAuth } from '../../lib/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { currentUser, userProfile, isSuperAdmin, toggleAdminRole, updateProfile, signOut } = useAuth();
  
  // Profile Edit States
  const [editName, setEditName] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync edit states when modal opens or profile loads
  useEffect(() => {
    if (isProfileModalOpen && userProfile) {
      setEditName(userProfile.name || '');
      setEditSpecialty(userProfile.specialty || '');
      setEditPhone(userProfile.phone || '');
      setEditLocation(userProfile.location || '');
    }
  }, [isProfileModalOpen, userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name: editName,
        specialty: editSpecialty,
        phone: editPhone,
        location: editLocation
      });
      setIsProfileModalOpen(false);
    } catch (err: any) {
      alert(`Update Failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-x-hidden">
      <div className="flex flex-1 text-left relative overflow-x-hidden">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Desktop & Tablet */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:min-h-full
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar 
            onClose={() => setIsSidebarOpen(false)} 
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
            <div className="flex items-center text-left min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 mr-1 sm:mr-2"
              >
                <Menu className="w-5 h-5 sm:w-6 h-6" />
              </button>
              
              <Link to="/" className="lg:hidden flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0">
                <img src="/logo.png" alt="Logo" className="h-6 sm:h-7 w-auto flex-shrink-0" />
                <span className="font-bold text-[#003875] text-xs sm:text-base truncate">ResourceFlow</span>
              </Link>
            </div>

            <div className="flex items-center gap-1 sm:gap-4 ml-2">
              {isSuperAdmin && (
                <button 
                  onClick={toggleAdminRole}
                  className="bg-purple-50 text-purple-700 text-[10px] font-black uppercase px-3 h-8 rounded-lg border border-purple-200 hover:bg-purple-100 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  {userProfile?.role === 'volunteer' ? 'Switch to Requester' : 'Switch to Volunteer'}
                </button>
              )}
              
              <button 
                 onClick={() => setIsProfileModalOpen(true)}
                 className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-100 font-inter min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="hidden sm:block text-right min-w-0">
                  <p className="text-xs sm:text-sm font-black text-gray-900 leading-none mb-1 truncate max-w-[80px] sm:max-w-[200px]">
                    {userProfile?.name?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'User'}
                  </p>
                  <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">
                    {userProfile?.role === 'volunteer' ? (userProfile.specialty || 'Unit') : 'Requester'}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg sm:rounded-xl flex items-center justify-center border border-blue-400/20 shadow-lg shadow-blue-900/20 flex-shrink-0">
                  <span className="text-[10px] sm:text-xs font-black text-white">
                    {(userProfile?.name || currentUser?.displayName || 'U')[0].toUpperCase()}
                  </span>
                </div>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>

      <Footer />

      {/* PROFILE MODAL */}
      {isProfileModalOpen && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-6 border-b flex justify-between items-center text-left bg-gray-50/10">
                  <div>
                     <h3 className="text-xl font-bold text-gray-900">Personnel Profile</h3>
                     <p className="text-xs text-gray-400 font-medium">Manage your tactical identity.</p>
                  </div>
                  <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
               </div>
               
               <form onSubmit={handleSaveProfile} className="p-6 space-y-5 text-left">
                  <div className="flex items-center gap-4 mb-2">
                     <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-100">{(userProfile?.name || 'U')[0]}</div>
                     <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 italic">Role Active</p>
                        <h4 className="text-lg font-bold text-gray-900 uppercase">{(userProfile?.role || 'Rescuer')}</h4>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"><User className="w-3 h-3" /> Full Identity</label>
                        <input required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all font-inter" />
                     </div>
                     <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"><Briefcase className="w-3 h-3" /> Area of Expertise</label>
                        <input value={editSpecialty} onChange={(e) => setEditSpecialty(e.target.value)} className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all font-inter" placeholder="E.g. Medical, Transport..." />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"><Phone className="w-3 h-3" /> Contact</label>
                           <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all font-inter" />
                        </div>
                        <div>
                           <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"><MapPin className="w-3 h-3" /> Deployment Base</label>
                           <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all font-inter" />
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                     <button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                     >
                        {isSaving ? 'Synchronizing...' : 'Save Mission Identity'}
                     </button>
                     <button 
                        type="button"
                        onClick={() => { if(window.confirm('Safe exit from mission hub?')) signOut(); }}
                        className="w-full h-12 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all border border-red-100"
                     >
                        <LogOut className="w-4 h-4" />
                        Terminate Session
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}

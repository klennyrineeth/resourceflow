import { 
  Home, 
  FileText, 
  Users, 
  Package, 
  X, 
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';



interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, signOut, isSuperAdmin, toggleAdminRole } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    ...(userProfile?.role === 'volunteer' ? [
      { name: 'Requests', href: '/requests', icon: FileText },
      { name: 'Volunteers', href: '/volunteers', icon: Users },
      { name: 'Resources', href: '/resources', icon: Package },
    ] : []),
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col relative">
      <div className="h-20 flex items-center px-4 border-b border-gray-200 justify-between flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="ResourceFlow Logo" className="h-8 w-auto object-contain" />
          <div className="text-lg font-semibold flex items-center">
            <span className="text-[#003875] font-bold">Resource</span>
            <span className="text-[#009AE5] font-normal italic">Flow</span>
          </div>
        </Link>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="pt-8 mt-4 border-t border-gray-100">
            {isSuperAdmin && (
              <button
                onClick={toggleAdminRole}
                className="w-full mb-3 bg-blue-50 text-blue-700 text-[10px] font-black uppercase py-2.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                {userProfile?.role === 'volunteer' ? 'Switch to Requester' : 'Switch to Volunteer'}
              </button>
            )}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between transition-all hover:bg-gray-100/50">
              <div className="flex items-center gap-3 overflow-hidden">
                 <div className="w-10 h-10 bg-blue-100 text-blue-600 flex items-center justify-center rounded-xl flex-shrink-0">
                    <UserIcon className="w-5 h-5" />
                 </div>
                 <div className="overflow-hidden text-left">
                    <p className="text-xs font-black text-gray-900 truncate tracking-tight">{userProfile?.name?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'User'}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{userProfile?.role === 'volunteer' ? (userProfile.specialty || 'Unit') : 'Requester'}</p>
                 </div>
              </div>
              <button 
                onClick={() => { handleLogout(); if(onClose) onClose(); }} 
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all group shadow-sm flex-shrink-0"
                title="Sign Out"
              >
                 <LogOut className="w-5 h-5" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

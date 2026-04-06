import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, ArrowRight, Shield, MapPin } from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import GoogleIcon from '../components/UI/GoogleIcon';
import { useAuth } from '../lib/AuthContext';
import Footer from '../components/Layout/Footer';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Signup() {
  const { signInWithGoogle } = useAuth();
  const [role, setRole] = useState<'volunteer' | 'needer'>('volunteer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      await signInWithGoogle(role);
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/dashboard');
    } catch (err: any) {
      alert(`Google Auth Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (res.user) {
        await updateProfile(res.user, { displayName: name });
        
        let lat = null;
        let lng = null;

        // Tactical Geocoding for Volunteer Signups
        if (location) {
          try {
             const gRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ', India')}&limit=1`);
             const gData = await gRes.json();
             if (gData && gData.length > 0) {
               lat = parseFloat(gData[0].lat);
               lng = parseFloat(gData[0].lon);
             }
          } catch (e) {}
        }
        
        await addDoc(collection(db, 'volunteers'), {
          name: name,
          email: email,
          role: role,
          specialty: role === 'volunteer' ? (profession || 'General Responder') : 'Community Member / Help Needer',
          location: location || 'Global Operations',
          lat: lat,
          lng: lng,
          status: 'active',
          rating: 5.0,
          tasks: 0,
          joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          phone: 'Not provided',
          createdAt: serverTimestamp(),
          uid: res.user.uid
        });

        localStorage.setItem('isAuthenticated', 'true');
        navigate('/dashboard');
      }
    } catch (err: any) {
      alert(`Signup Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center w-full mb-10">
          <Link to="/" className="inline-flex items-center gap-3 hover:opacity-90 transition-opacity group">
            <img src="/logo.png" alt="Logo" className="h-10 sm:h-12 w-auto group-hover:scale-105 transition-transform" />
            <div className="text-2xl sm:text-3xl font-bold flex items-center tracking-tight">
              <span className="text-[#003875]">Resource</span>
              <span className="text-[#009AE5] italic">Flow</span>
            </div>
          </Link>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {role === 'volunteer' ? 'Join as Volunteer' : 'Sign up for Help'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium font-inter">
          {role === 'volunteer' ? 'Join the humanitarian response network today.' : 'Get the support you need from our community.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md font-inter">
        <Card className="py-10 px-8 shadow-2xl border border-gray-100 rounded-3xl bg-white">
          <div className="space-y-6">
            <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setRole('needer')}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  role === 'needer' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Help Needer
              </button>
              <button
                type="button"
                onClick={() => setRole('volunteer')}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  role === 'volunteer' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Volunteer
              </button>
            </div>

            <Button
              variant="secondary"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full h-11 justify-center gap-3 border-gray-200 hover:bg-gray-50 shadow-sm rounded-xl"
            >
              <GoogleIcon className="w-5 h-5" />
              <span className="font-bold text-gray-700">Continue with Google</span>
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-black tracking-widest">Or connect via credentials</span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSignup}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    disabled={loading}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm shadow-sm"
                    placeholder="Enter full name..."
                    required
                  />
                </div>
              </div>

              {role === 'volunteer' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Your Profession</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={profession}
                      disabled={loading}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm shadow-sm"
                      placeholder="e.g. Doctor, Logistics, Driver..."
                      required={role === 'volunteer'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    disabled={loading}
                    autoComplete="off"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm shadow-sm"
                    placeholder="Email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Base Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={location}
                    disabled={loading}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm shadow-sm"
                    placeholder="City / District (e.g. Hyderabad)"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    disabled={loading}
                    minLength={6}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm shadow-sm"
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">Min. 6 characters required</p>
              </div>

              <Button variant="primary" className="w-full h-12 justify-center font-bold font-inter rounded-xl shadow-md" type="submit" disabled={loading}>
                {loading ? "Joining..." : (
                  <>
                    {role === 'volunteer' ? 'Join as Volunteer' : 'Create Account'}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </Card>
        
        <p className="mt-8 text-center text-sm text-gray-600 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4">
            Sign In
          </Link>
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
           <Shield className="w-4 h-4 text-blue-300" />
           <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Identity Management Secured</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

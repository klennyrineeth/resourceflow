import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Mail, Lock } from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import GoogleIcon from '../components/UI/GoogleIcon';
import Footer from '../components/Layout/Footer';
import { useAuth } from '../lib/AuthContext';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const { signInWithGoogle, loginAsAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      alert(`Google Login Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Default admin bypass
    if (email === 'admin' && password === '1234') {
      loginAsAdmin();
      navigate('/dashboard');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/dashboard');
    } catch (err: any) {
      alert(`Login Failed: ${err.message}`);
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
          Sign In
        </h2>
        <p className="mt-2 text-center text-gray-400 text-sm font-medium">Access your personalized mission dashboard.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-10 px-6 sm:px-8 shadow-2xl border border-gray-100 rounded-3xl bg-white">
          <div className="space-y-6">

            <Button
              variant="secondary"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 justify-center gap-3 border-gray-200 hover:bg-gray-50 shadow-sm rounded-xl"
            >
              <GoogleIcon className="w-5 h-5" />
              <span className="font-bold text-gray-700">Continue with Google</span>
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-black tracking-widest">Or login with email</span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={email}
                    disabled={loading}
                    autoComplete="off"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                    placeholder="Email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Password</label>
                  <a href="#" className="text-[10px] text-blue-600 hover:text-blue-700 font-black uppercase tracking-tighter">Forgot Password</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    disabled={loading}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button variant="primary" className="w-full h-12 justify-center font-bold rounded-xl" type="submit" disabled={loading}>
                {loading ? "Authenticating..." : (
                  <>
                    Initialize Session
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </Card>
        
        <p className="mt-8 text-center text-sm text-gray-600 font-medium">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4">
            Join as Volunteer
          </Link>
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
           <Shield className="w-4 h-4 text-blue-300" />
           <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Secured via Firebase Identity Center</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

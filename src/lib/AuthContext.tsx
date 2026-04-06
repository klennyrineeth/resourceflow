import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, query, where, doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const PRIVILEGED_EMAILS = [
  'resourceflow01@gmail.com', 
  'klennyrineeth@gmail.com', 
  'admin@relay.org',
  'rineeth@gmail.com',
  'klennyrineeth1@gmail.com'
];

interface UserProfile {
  uid: string;
  role: 'volunteer' | 'needer';
  name: string;
  specialty?: string;
  email: string;
  phone?: string;
  location?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signInWithGoogle: (role?: 'volunteer' | 'needer') => Promise<void>;
  signOut: () => Promise<void>;
  toggleAdminRole: () => void;
  loginAsAdmin: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(localStorage.getItem('isLocalAdmin') === 'true');
  const [adminRole, setAdminRole] = useState<'volunteer' | 'needer'>(localStorage.getItem('adminTestRole') as 'volunteer' | 'needer' || 'volunteer');

  // Helper to check if an email is privileged
  const checkPrivileged = (email: string | null | undefined) => {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    return PRIVILEGED_EMAILS.some(e => e.toLowerCase().trim() === cleanEmail);
  };

  // Main Auth Listener
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log("DEBUG: Auth State Changed. User:", user?.email);
      setCurrentUser(user);
      
      const isPrivileged = user ? checkPrivileged(user.email) : false;

      if (user) {
        localStorage.setItem('isAuthenticated', 'true');
        
        if (isPrivileged) {
          console.log("DEBUG: High Priority Admin Detected:", user.email);
          localStorage.setItem('isLocalAdmin', 'true');
          setIsSuperAdmin(true);
        }

        const q = query(collection(db, 'volunteers'), where('uid', '==', user.uid));
        unsubscribeProfile = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data() as any;
            const finalIsPrivileged = isPrivileged || checkPrivileged(data.email);
            
            if (finalIsPrivileged) {
              console.log("DEBUG: Confirmed High Priority Admin:", data.email);
              localStorage.setItem('isLocalAdmin', 'true');
              setIsSuperAdmin(true);
            }

            setUserProfile({
              uid: user.uid,
              role: (finalIsPrivileged || isSuperAdmin) ? adminRole : (data.role || 'volunteer'),
              name: data.name,
              specialty: data.specialty,
              email: user.email || data.email,
              phone: data.phone,
              location: data.location
            });
            setLoading(false);
          } else {
             handleNewUser(user);
          }
        });
      } else {
        // Handle Local Admin Bypass if no Firebase user
        if (localStorage.getItem('isLocalAdmin') === 'true') {
           setIsSuperAdmin(true);
           setUserProfile({
             uid: 'ADMIN_BYPASS',
             name: 'ResourceFlow Admin',
             email: 'resourceflow01@gmail.com',
             role: adminRole,
             specialty: 'Emergency Controller'
           });
        } else {
           setUserProfile(null);
           setIsSuperAdmin(false);
        }
        setLoading(false);
      }
    });

    const handleNewUser = async (user: User) => {
      const intendedRole = sessionStorage.getItem('intendedRole') as 'volunteer' | 'needer' | null;
      try {
        await setDoc(doc(db, 'volunteers', user.uid), {
          name: user.displayName || 'Relay Responder',
          email: user.email || '',
          role: intendedRole || 'volunteer',
          specialty: intendedRole === 'needer' ? 'Community Member' : 'General Relief Agent',
          location: 'Regional HQ',
          status: 'active',
          rating: 5.0,
          tasks: 0,
          joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          phone: user.phoneNumber || 'Not provided',
          createdAt: serverTimestamp(),
          uid: user.uid
        });
      } catch (e) {
        console.error("Auto-profile creation failed:", e);
      } finally {
        setLoading(false);
      }
    };

    getRedirectResult(auth).catch((error) => console.error("Redirect Auth Error:", error));

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []); 

  // Dedicated SuperAdmin Role Sync
  useEffect(() => {
    if ((isSuperAdmin || checkPrivileged(currentUser?.email)) && userProfile) {
      if (userProfile.role !== adminRole) {
        setUserProfile(prev => prev ? { ...prev, role: adminRole } : null);
      }
    }
  }, [adminRole, isSuperAdmin, currentUser?.email, userProfile?.uid]); 

  const signInWithGoogle = async (role?: 'volunteer' | 'needer') => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    if (role) sessionStorage.setItem('intendedRole', role);
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, provider);
      } else {
        throw error;
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('isLocalAdmin');
      localStorage.removeItem('adminTestRole');
      setIsSuperAdmin(false);
      window.location.href = '/'; 
    } catch (error) {
      console.error("Sign Out Error:", error);
      throw error;
    }
  };

  const toggleAdminRole = () => {
    const nextRole = adminRole === 'volunteer' ? 'needer' : 'volunteer';
    setAdminRole(nextRole);
    localStorage.setItem('adminTestRole', nextRole);
  };

  const loginAsAdmin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('isLocalAdmin', 'true');
    setIsSuperAdmin(true);
    setUserProfile({
      uid: 'ADMIN_BYPASS',
      name: 'ResourceFlow Admin',
      email: 'resourceflow01@gmail.com',
      role: adminRole,
      specialty: 'Emergency Controller'
    });
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser && !isSuperAdmin) throw new Error("No authenticated session.");
    const uid = currentUser?.uid || 'ADMIN_BYPASS';
    const userRef = doc(db, 'volunteers', uid);
    
    const updateData = { ...data };
    delete (updateData as any).uid;
    
    await setDoc(userRef, { 
      ...updateData, 
      updatedAt: serverTimestamp() 
    }, { merge: true });
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      isSuperAdmin,
      signInWithGoogle,
      signOut,
      toggleAdminRole,
      loginAsAdmin,
      updateProfile
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

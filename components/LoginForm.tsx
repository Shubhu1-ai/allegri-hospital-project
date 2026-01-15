import React, { useState, useEffect } from 'react';
import { Lock, User, AlertCircle, Eye, EyeOff, UserPlus, Briefcase, Building2, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

// We extend the UserProfile type to include a password for storage
interface StoredUser extends UserProfile {
  password: string;
}

interface LoginFormProps {
  onLogin: (user: UserProfile | null) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  // Toggle between Login and Signup mode
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Extra fields for Signup
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // The Database (Loaded from LocalStorage)
  const [users, setUsers] = useState<StoredUser[]>([]);

  // 1. Load users from memory when the app starts
  useEffect(() => {
    const savedUsers = localStorage.getItem('ALLEGRI_USERS');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  // 2. Handle Login Logic
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const foundUser = users.find(u => u.username === username && u.password === password);

    if (foundUser) {
      // Success: Send user data to App.tsx
      onLogin({
        username: foundUser.username,
        role: foundUser.role,
        department: foundUser.department,
        avatarUrl: ''
      });
    } else {
      setError('Invalid username or password.');
      onLogin(null);
    }
  };

  // 3. Handle Sign Up Logic
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validation: Capacity Limit
    if (users.length >= 10) {
      setError('System Capacity Reached (10/10 Users). Contact Administrator.');
      return;
    }

    // Validation: Empty Fields
    if (!username || !password || !role || !department) {
      setError('All fields are required for registration.');
      return;
    }

    // Validation: Username taken?
    if (users.some(u => u.username === username)) {
      setError('Username already exists. Please choose another.');
      return;
    }

    // Create new user object
    const newUser: StoredUser = {
      username,
      password,
      role,
      department,
      avatarUrl: ''
    };

    // Save to State and LocalStorage
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('ALLEGRI_USERS', JSON.stringify(updatedUsers));

    // Reset and switch to login
    setSuccessMsg('Account created successfully! Please log in.');
    setIsLoginMode(true);
    setPassword(''); // clear password for security
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 transition-all duration-300">
        
        {/* Header Section */}
        <div className={`${isLoginMode ? 'bg-emerald-600' : 'bg-slate-800'} p-10 text-center transition-colors duration-500`}>
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            {isLoginMode ? 'ALLEGRI Login' : 'New Account'}
          </h2>
          <p className="text-white/80 text-sm font-medium uppercase tracking-widest">
            {isLoginMode ? 'Medical Portal Access' : `Registration (${users.length}/10 Users)`}
          </p>
        </div>
        
        <form onSubmit={isLoginMode ? handleLogin : handleSignup} className="p-8 space-y-5 bg-white">
          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-100 animate-in slide-in-from-top-2">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-100 animate-in slide-in-from-top-2">
              <UserPlus size={16} className="shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Input: Username */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Username</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 bg-slate-50 text-slate-800 border-2 border-slate-100 rounded-xl focus:border-emerald-500 focus:bg-white transition-all outline-none font-medium"
                placeholder="Ex: ALLEGRI"
              />
            </div>
          </div>

          {/* Input: Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-12 py-3 bg-slate-50 text-slate-800 border-2 border-slate-100 rounded-xl focus:border-emerald-500 focus:bg-white transition-all outline-none font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* SIGN UP ONLY FIELDS */}
          {!isLoginMode && (
            <div className="space-y-5 animate-in slide-in-from-bottom-4 fade-in duration-300">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Job Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Briefcase size={18} />
                  </div>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-slate-50 text-slate-800 border-2 border-slate-100 rounded-xl focus:border-slate-800 focus:bg-white transition-all outline-none font-medium"
                    placeholder="Ex: Senior Technician"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Department</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Building2 size={18} />
                  </div>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-slate-50 text-slate-800 border-2 border-slate-100 rounded-xl focus:border-slate-800 focus:bg-white transition-all outline-none font-medium"
                    placeholder="Ex: Microbiology"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            className={`w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-black text-white uppercase tracking-widest active:scale-[0.98] transition-all mt-6 ${
              isLoginMode 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                : 'bg-slate-800 hover:bg-slate-900 shadow-slate-500/20'
            }`}
          >
            {isLoginMode ? (
              <>Sign In <ArrowRight size={18} /></>
            ) : (
              <>Create Account <UserPlus size={18} /></>
            )}
          </button>

          {/* Toggle Mode */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError('');
                setSuccessMsg('');
              }}
              className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-wider"
            >
              {isLoginMode ? "Need an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
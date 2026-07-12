import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../../../backend/db/types';
import { dbGetUsers } from '../../../backend/db/db';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setOverrideRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if session exists in storage
    const savedSession = localStorage.getItem('transitops_session');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const users = dbGetUsers();
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (foundUser) {
      const sessionUser = { id: foundUser.id, name: foundUser.name, email: foundUser.email, role: foundUser.role };
      localStorage.setItem('transitops_session', JSON.stringify(sessionUser));
      setUser(sessionUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('transitops_session');
    setUser(null);
  };

  // Hot-swapping switcher context to support developer persona testing
  const setOverrideRole = (role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role };
      localStorage.setItem('transitops_session', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } else {
      // Create a temporary guest user with that role
      const tempUser: User = {
        id: 'u-temp',
        name: `Demo ${role}`,
        email: `${role.toLowerCase().replace(' ', '')}@transitops.com`,
        role
      };
      localStorage.setItem('transitops_session', JSON.stringify(tempUser));
      setUser(tempUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setOverrideRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

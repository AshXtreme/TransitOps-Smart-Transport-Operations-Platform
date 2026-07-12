import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Shell } from './components/Shell';
import { RoleSwitcher } from './components/RoleSwitcher';
import { initDb } from '../../backend/db/db';

const TransitApp: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Scaffold database and load initial mock datasets
    initDb();
  }, []);

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <Shell />
      <RoleSwitcher />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <TransitApp />
    </AuthProvider>
  );
}

export default App;

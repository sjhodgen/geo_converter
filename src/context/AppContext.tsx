import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VERSION } from '../config/version';

// Define types for our context
interface AppContextType {
  version: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

// Create the context with default values
const AppContext = createContext<AppContextType>({
  version: VERSION,
  isDarkMode: false,
  toggleDarkMode: () => {},
  isLoading: false,
  setIsLoading: () => {},
  error: null,
  setError: () => {},
});

// Props for our provider component
interface AppContextProviderProps {
  children: ReactNode;
}

// Provider component to wrap around our app
export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Values to provide through the context
  const value = {
    version: VERSION,
    isDarkMode,
    toggleDarkMode,
    isLoading,
    setIsLoading,
    error,
    setError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
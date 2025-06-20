'use client'
import {createContext, useContext} from 'react';

interface AuthContextType {
    currentUser: {
        id: string;
        name: string;
        email: string;
    };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthContextProvider');
    }
    return context;
};

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
    const currentUser = {
        id: "default-user",
        name: "User",
        email: "user@example.com"
    };

    return (
        <AuthContext.Provider value={{ currentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

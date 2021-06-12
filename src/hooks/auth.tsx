import React, { useContext, useState } from 'react';
import { createContext, ReactNode } from 'react';
import * as Google from 'expo-google-app-auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

interface IAuthContextData {
  user: User;
  loadingStorage: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const userStorageKey = '@gofinances:user'

const AuthContext = createContext({} as IAuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>({} as User);
  const [loadingStorage, setLoadingStorage] = useState(true);

  useEffect(() => {
    async function loadUserStoragedData() {
      const data = await AsyncStorage.getItem(userStorageKey);

      if (data) {
        setUser(JSON.parse(data) as User);
      }

      setLoadingStorage(false);
    }

    loadUserStoragedData();
  }, []);

  async function signOut() {
    setUser({} as User);
    await AsyncStorage.removeItem(userStorageKey);
  }

  async function signInWithGoogle() {
    try {
      const result = await Google.logInAsync({
        iosClientId: '922351318814-9m3luoop1ra9h0kj6pnptfaj3mk98sfv.apps.googleusercontent.com',
        androidClientId: '922351318814-mc3r2mvnvi233c65lb6olaemf0e3hn7k.apps.googleusercontent.com',
        scopes: ['profile', 'email']
      });

      if (result.type === 'success') {
        const userLogged = {
          id: result.user.id!,
          email: result.user.email!,
          name: result.user.name!,
          photo: result.user.photoUrl!
        }

        await AsyncStorage.setItem(userStorageKey, JSON.stringify(userLogged));
        setUser(userLogged);
      } else {
        throw new Error();
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async function signInWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ]
      });

      if (credential) {
        const name = credential.fullName?.givenName!;

        const userLogged = {
          id: credential.user,
          email: credential.email!,
          name,
          photo: `https://ui-avatars.com/api/?name=${name}`
        };

        await AsyncStorage.setItem(userStorageKey, JSON.stringify(userLogged));
        setUser(userLogged);
      } else {
        throw new Error();
      }

    } catch (error) {
      throw new Error(error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signInWithApple, signOut, loadingStorage }}>
      { children }
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext);

  return context;
}
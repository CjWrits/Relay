'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, Person, Project } from '@/types/relay';
import { ATLAS_PROJECT, ATLAS_PEOPLE } from '@/data/mockAtlasData';

interface RelayContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: Person;
  currentProject: Project;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  isDemoMode: boolean;
  canViewRestricted: boolean;
  canEditClaims: boolean;
  canApproveHandovers: boolean;
  loginAsDemoUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const RelayContext = createContext<RelayContextType | undefined>(undefined);

export function RelayProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRoleState] = useState<UserRole>('ADMIN');
  const [currentUserId, setCurrentUserId] = useState<string>('usr-marcus-04');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  // Match the user object to ID / role
  const currentUser = React.useMemo(() => {
    const found = ATLAS_PEOPLE.find((p) => p.id === currentUserId);
    if (found) return found;

    switch (currentRole) {
      case 'ADMIN':
        return ATLAS_PEOPLE[3]; // Marcus Vance (Admin)
      case 'REVIEWER':
        return ATLAS_PEOPLE[2]; // Elena Rostova (Reviewer)
      case 'INCOMING_MEMBER':
        return ATLAS_PEOPLE[1]; // Maya Chen (Incoming)
      default:
        return ATLAS_PEOPLE[3];
    }
  }, [currentUserId, currentRole]);

  // Sync role to server session via secure API
  const setCurrentRole = useCallback(async (role: UserRole) => {
    let targetUserId = 'usr-marcus-04';
    if (role === 'ADMIN') targetUserId = 'usr-marcus-04';
    else if (role === 'REVIEWER') targetUserId = 'usr-elena-03';
    else if (role === 'INCOMING_MEMBER') targetUserId = 'usr-maya-02';

    setCurrentRoleState(role);
    setCurrentUserId(targetUserId);

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
      }
    } catch {
      // Fallback in-memory
    }
  }, []);

  const loginAsDemoUser = useCallback(async (userId: string) => {
    let targetRole: UserRole = 'ADMIN';
    if (userId === 'usr-marcus-04') targetRole = 'ADMIN';
    else if (userId === 'usr-elena-03') targetRole = 'REVIEWER';
    else if (userId === 'usr-maya-02') targetRole = 'INCOMING_MEMBER';

    setCurrentUserId(userId);
    setCurrentRoleState(targetRole);

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
      }
    } catch {
      // Fallback
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch {
      // Ignore
    }
    document.cookie = 'relay_user_id=; path=/; max-age=0';
    setIsAuthenticated(false);
  }, []);

  // On mount, inspect cookie or session from server
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.isAuthenticated && data.session?.user?.id) {
            setCurrentUserId(data.session.user.id);
            setCurrentRoleState(data.session.role);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        // Local fallback
      } finally {
        setIsLoadingSession(false);
      }
    };
    fetchSession();
  }, []);

  const canViewRestricted = currentRole === 'ADMIN' || currentRole === 'REVIEWER';
  const canEditClaims = currentRole === 'ADMIN' || currentRole === 'REVIEWER';
  const canApproveHandovers = currentRole === 'ADMIN' || currentRole === 'REVIEWER';

  return (
    <RelayContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentUser,
        currentProject: ATLAS_PROJECT,
        isAuthenticated,
        isLoadingSession,
        isDemoMode: true,
        canViewRestricted,
        canEditClaims,
        canApproveHandovers,
        loginAsDemoUser,
        logout,
      }}
    >
      {children}
    </RelayContext.Provider>
  );
}

export function useRelay() {
  const context = useContext(RelayContext);
  if (!context) {
    throw new Error('useRelay must be used within a RelayProvider');
  }
  return context;
}

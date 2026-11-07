'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Person, Project } from '@/types/relay';
import { ATLAS_PROJECT, ATLAS_PEOPLE } from '@/data/mockAtlasData';

interface RelayContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: Person;
  currentProject: Project;
  isDemoMode: boolean;
  canViewRestricted: boolean;
  canEditClaims: boolean;
  canApproveHandovers: boolean;
}

const RelayContext = createContext<RelayContextType | undefined>(undefined);

export function RelayProvider({ children }: { children: React.ReactNode }) {
  // Default to ADMIN for demonstration exploration, but easily toggleable
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');

  // Match the user object to role
  const currentUser = React.useMemo(() => {
    switch (currentRole) {
      case 'ADMIN':
        return ATLAS_PEOPLE[3]; // Marcus Vance (Admin)
      case 'REVIEWER':
        return ATLAS_PEOPLE[2]; // Elena Rostova (Reviewer)
      case 'INCOMING_MEMBER':
        return ATLAS_PEOPLE[1]; // Maya Chen (Incoming)
      default:
        return ATLAS_PEOPLE[0];
    }
  }, [currentRole]);

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
        isDemoMode: true,
        canViewRestricted,
        canEditClaims,
        canApproveHandovers,
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

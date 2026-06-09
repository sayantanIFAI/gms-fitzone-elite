import { createContext, useContext, useState } from 'react'

const UserContext = createContext(null)

export const PERSONAS = [
  {
    id: 'mem_001',
    name: 'Jim Fletcher',
    role: 'member',
    sub: 'Premium Member',
    description: 'Tracks fitness goals, classes, PRs and cardio vitals.',
    avatar_color: '#7c3aed',
    initials: 'JF',
    emoji: '🏋️',
  },
  {
    id: 'mem_002',
    name: 'Susan Clarke',
    role: 'member',
    sub: 'Standard Member',
    description: 'Books wellness services and relaxation sessions.',
    avatar_color: '#06b6d4',
    initials: 'SC',
    emoji: '💆',
  },
  {
    id: 'mem_003',
    name: 'Akalla Mensah',
    role: 'trainer',
    sub: 'Lead Trainer',
    description: 'Monitors class attendance and member engagement.',
    avatar_color: '#f59e0b',
    initials: 'AM',
    emoji: '🎯',
  },
  {
    id: 'mem_004',
    name: 'David Park',
    role: 'admin',
    sub: 'Gym Administrator',
    description: 'Oversees machines, payments, and member accounts.',
    avatar_color: '#10b981',
    initials: 'DP',
    emoji: '⚡',
  },
]

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}

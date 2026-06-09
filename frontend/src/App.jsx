import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './context/UserContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import MemberDashboard from './pages/MemberDashboard'
import WellnessDashboard from './pages/WellnessDashboard'
import TrainerDashboard from './pages/TrainerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ClassesCalendar from './pages/member/ClassesCalendar'
import VitalsCardio from './pages/member/VitalsCardio'
import PersonalRecords from './pages/member/PersonalRecords'

function ProtectedRoutes() {
  const { user } = useUser()
  if (!user) return <Navigate to="/" replace />

  const isRegularMember = user.role === 'member' && user.id !== 'mem_002'

  let Dashboard
  if (user.role === 'admin')        Dashboard = AdminDashboard
  else if (user.role === 'trainer') Dashboard = TrainerDashboard
  else if (user.id === 'mem_002')   Dashboard = WellnessDashboard
  else Dashboard = MemberDashboard

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        {isRegularMember && <>
          <Route path="/dashboard/classes" element={<ClassesCalendar />} />
          <Route path="/dashboard/vitals"  element={<VitalsCardio />} />
          <Route path="/dashboard/records" element={<PersonalRecords />} />
        </>}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}

import React, { useContext } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Internships from './pages/Internships'
import Maintenance from './pages/Maintenance'
import Rooms from './pages/Rooms'
import Payments from './pages/Payments'
import Users from './pages/Users'
import { AuthContext } from './context/AuthContext'

export default function App(){
  const { user, logout } = useContext(AuthContext)

  const roleLinks = []
  if (user) {
    roleLinks.push({ to: '/internships', label: 'Internships' })
    if (user.role === 'student') {
      roleLinks.push({ to: '/maintenance', label: 'Maintenance' })
      roleLinks.push({ to: '/rooms', label: 'Room Allocation' })
    }
    if (user.role === 'accommodation' || user.role === 'admin') {
      roleLinks.push({ to: '/rooms', label: 'Rooms' })
      roleLinks.push({ to: '/maintenance', label: 'Maintenance' })
    }
    if (user.role === 'finance' || user.role === 'admin') {
      roleLinks.push({ to: '/payments', label: 'Payments' })
    }
    if (user.role === 'admin') {
      roleLinks.push({ to: '/users', label: 'Users' })
    }
    if (user.role === 'coordinator') {
      roleLinks.push({ to: '/maintenance', label: 'Maintenance' })
    }
  }

  return (
    <div className="container py-4">
      <nav className="mb-3 d-flex align-items-center flex-wrap gap-2">
        <Link to="/" className="me-3">Home</Link>
        {roleLinks.map(link => (
          <Link key={link.to} to={link.to} className="me-3">{link.label}</Link>
        ))}
        {user ? (
          <>
            <span className="me-3">Hello, {user.first_name || user.username}</span>
            <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="me-3">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/internships" element={<Internships/>} />
        <Route path="/maintenance" element={<Maintenance/>} />
        <Route path="/rooms" element={<Rooms/>} />
        <Route path="/payments" element={<Payments/>} />
        <Route path="/users" element={<Users/>} />
      </Routes>
    </div>
  )
}

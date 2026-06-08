import React, { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function Dashboard(){
  const { user } = useContext(AuthContext)

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome to the University Internship Management System.</p>
      {user ? (
        <div>
          <p>You are logged in as <strong>{user.first_name || user.username}</strong>.</p>
          <p>Role: <strong>{user.role}</strong></p>
          <p>
            Use the navigation links to manage internships, maintenance, room allocations, payments, and users according to your role.
          </p>
        </div>
      ) : (
        <p>Use the navigation to log in or register.</p>
      )}
    </div>
  )
}

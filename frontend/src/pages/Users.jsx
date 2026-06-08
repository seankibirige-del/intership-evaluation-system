import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import API from '../services/api'

export default function Users(){
  const { user } = useContext(AuthContext)
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ username:'', password:'', first_name:'', last_name:'', email:'', role:'student' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      setError(null)
      try {
        const response = await API.get('users/')
        setUsers(response.data)
      } catch (err) {
        setError('Unable to load users.')
      } finally {
        setLoading(false)
      }
    }
    if (user && user.role === 'admin') {
      loadUsers()
    } else {
      setLoading(false)
    }
  }, [user])

  const submit = async e => {
    e.preventDefault()
    setError(null)
    try {
      const response = await API.post('users/', form)
      setUsers(prev => [response.data, ...prev])
      setForm({ username:'', password:'', first_name:'', last_name:'', email:'', role:'student' })
    } catch (err) {
      setError(err.response?.data || 'Unable to create user.')
    }
  }

  if (!user) {
    return (
      <div>
        <h2>Users</h2>
        <p className="text-muted">You must be logged in as admin to manage users.</p>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div>
        <h2>Users</h2>
        <p className="text-muted">Only admin users can manage system users.</p>
      </div>
    )
  }

  return (
    <div>
      <h2>User Management</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Create New User</h5>
          <form onSubmit={submit}>
            <div className="row g-2">
              <div className="col-md-4">
                <input className="form-control" placeholder="Username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
              </div>
              <div className="col-md-4">
                <input type="password" className="form-control" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
              </div>
              <div className="col-md-4">
                <input className="form-control" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
              </div>
              <div className="col-md-4">
                <input className="form-control" placeholder="First name" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} />
              </div>
              <div className="col-md-4">
                <input className="form-control" placeholder="Last name" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} />
              </div>
              <div className="col-md-4">
                <select className="form-select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                  <option value="student">Student</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="finance">Finance</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button className="btn btn-success mt-3">Create User</button>
          </form>
        </div>
      </div>
      {loading ? (
        <p>Loading users...</p>
      ) : users.length ? (
        <div className="list-group">
          {users.map(item => (
            <div key={item.id} className="list-group-item">
              <div className="d-flex justify-content-between">
                <strong>{item.username}</strong>
                <span>{item.role}</span>
              </div>
              <p className="mb-0">{item.first_name} {item.last_name}</p>
              <p className="mb-0"><small>{item.email}</small></p>
            </div>
          ))}
        </div>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  )
}

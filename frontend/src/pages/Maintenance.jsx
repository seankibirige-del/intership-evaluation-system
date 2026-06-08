import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import API from '../services/api'

export default function Maintenance(){
  const { user } = useContext(AuthContext)
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({ title:'', description:'', priority:'medium' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRequests = async () => {
      setError(null)
      try {
        const response = await API.get('maintenance/')
        setRequests(response.data)
      } catch (err) {
        setError('Unable to load maintenance requests.')
      } finally {
        setLoading(false)
      }
    }
    if (user) {
      loadRequests()
    } else {
      setLoading(false)
    }
  }, [user])

  const submit = async e => {
    e.preventDefault()
    setError(null)
    try {
      const response = await API.post('maintenance/', form)
      setRequests(prev => [response.data, ...prev])
      setForm({ title:'', description:'', priority:'medium' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to submit request.')
    }
  }

  if (!user) {
    return (
      <div>
        <h2>Maintenance</h2>
        <p className="text-muted">You must be logged in to view maintenance requests.</p>
      </div>
    )
  }

  return (
    <div>
      <h2>Maintenance Requests</h2>
      <p>Role: <strong>{user.role}</strong></p>
      {error && <div className="alert alert-danger">{error}</div>}
      {user.role === 'student' && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Submit a maintenance request</h5>
            <form onSubmit={submit}>
              <input className="form-control mb-2" placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
              <textarea className="form-control mb-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
              <select className="form-select mb-2" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button className="btn btn-primary">Submit Request</button>
            </form>
          </div>
        </div>
      )}
      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length ? (
        <div className="list-group">
          {requests.map(req => (
            <div key={req.id} className="list-group-item">
              <div className="d-flex justify-content-between">
                <h5>{req.title}</h5>
                <span className="badge bg-secondary">{req.status}</span>
              </div>
              <p>{req.description}</p>
              <p className="mb-1"><strong>Priority:</strong> {req.priority}</p>
              <small>Submitted: {new Date(req.date_submitted).toLocaleString()}</small>
            </div>
          ))}
        </div>
      ) : (
        <p>No maintenance requests found.</p>
      )}
    </div>
  )
}

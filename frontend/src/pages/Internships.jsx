import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import API from '../services/api'

export default function Internships(){
  const { user } = useContext(AuthContext)
  const [internships,setInternships] = useState([])
  const [form,setForm] = useState({
    company_name:'',
    company_address:'',
    supervisor:'',
    start_date:'',
    end_date:'',
  })
  const [error,setError] = useState(null)
  const [loading,setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setError(null)
      try {
        const response = await API.get('internships/')
        setInternships(response.data)
      } catch (err) {
        setError('Unable to load internships. Please login or try again.')
      } finally {
        setLoading(false)
      }
    }
    if (user) load()
    else setLoading(false)
  }, [user])

  const submit = async e => {
    e.preventDefault()
    setError(null)
    try {
      const response = await API.post('internships/', form)
      setInternships(prev => [response.data, ...prev])
      setForm({ company_name:'', company_address:'', supervisor:'', start_date:'', end_date:'' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit internship.')
    }
  }

  if (!user) {
    return (
      <div>
        <h2>Internships</h2>
        <p className="text-muted">You must be logged in to view or submit internships.</p>
      </div>
    )
  }

  return (
    <div>
      <h2>Internships</h2>
      <p>Logged in as <strong>{user.first_name || user.username}</strong> ({user.role}).</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Apply for Internship</h5>
              <form onSubmit={submit}>
                <input className="form-control mb-2" placeholder="Company name" value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})} />
                <textarea className="form-control mb-2" placeholder="Company address" value={form.company_address} onChange={e=>setForm({...form,company_address:e.target.value})} />
                <input className="form-control mb-2" placeholder="Supervisor" value={form.supervisor} onChange={e=>setForm({...form,supervisor:e.target.value})} />
                <input type="date" className="form-control mb-2" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} />
                <input type="date" className="form-control mb-2" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} />
                <button className="btn btn-primary">Submit Application</button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <h5>My Applications</h5>
          {loading ? (
            <p>Loading internships...</p>
          ) : internships.length ? (
            <div className="list-group">
              {internships.map(internship => (
                <div key={internship.id} className="list-group-item">
                  <h6>{internship.company_name}</h6>
                  <p className="mb-1">Status: <strong>{internship.status}</strong></p>
                  <p className="mb-1">Supervisor: {internship.supervisor}</p>
                  <small>{internship.start_date || 'No start date'} — {internship.end_date || 'No end date'}</small>
                </div>
              ))}
            </div>
          ) : (
            <p>No internship applications yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

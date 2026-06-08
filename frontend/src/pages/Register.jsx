import React, { useState } from 'react'
import API from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const [form,setForm]=useState({
    username:'',
    password:'',
    first_name:'',
    last_name:'',
    email:'',
    role:'student',
    student_number:'',
  })
  const [error,setError]=useState(null)
  const nav = useNavigate()

  const submit = async e =>{
    e.preventDefault()
    // Client-side validation to match backend requirements
    if (form.role === 'student' && !form.student_number) {
      setError('Student number is required for student registration.')
      return
    }

    try {
      await API.post('auth/register/', form)
      nav('/login')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        // If server returned field errors, format them for display
        if (typeof data === 'object') {
          const parts = []
          Object.entries(data).forEach(([k, v]) => {
            if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`)
            else parts.push(`${k}: ${v}`)
          })
          setError(parts.join(' | '))
        } else {
          setError(String(data))
        }
      } else {
        setError('Registration failed')
      }
    }
  }

  return (
    <div className="col-md-8">
      <h3>Register</h3>
      {error && <div className="alert alert-danger">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
      <form onSubmit={submit}>
        <input className="form-control mb-2" placeholder="Username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
        <input type="password" className="form-control mb-2" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        <input className="form-control mb-2" placeholder="First name" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} />
        <input className="form-control mb-2" placeholder="Last name" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} />
        <input className="form-control mb-2" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <select className="form-select mb-2" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
          <option value="student">Student</option>
          <option value="coordinator">Internship Coordinator</option>
          <option value="accommodation">Accommodation Officer</option>
          <option value="finance">Finance Officer</option>
          <option value="admin">System Administrator</option>
        </select>
        {form.role === 'student' && (
          <input className="form-control mb-2" placeholder="Student number" value={form.student_number} onChange={e=>setForm({...form,student_number:e.target.value})} />
        )}
        <button className="btn btn-success">Register</button>
      </form>
    </div>
  )
}

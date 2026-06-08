import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Login(){
  const [username,setUsername]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState(null)
  const { login } = useContext(AuthContext)
  const nav = useNavigate()

  const submit = async e =>{
    e.preventDefault()
    setError(null)
    try{
      await login(username,password)
      nav('/')
    }catch(err){
      const detail = err.response?.data?.detail
      const status = err.response?.status
      const raw = err.response?.data || err.message
      setError(detail || (status ? `Login failed (${status})` : 'Login failed') + (detail ? '' : `: ${JSON.stringify(raw)}`))
      console.error('Login error', status, raw)
    }
  }

  return (
    <div className="col-md-6">
      <h3>Login</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <div className="mb-2">
          <label className="form-label">Username</label>
          <input className="form-control" value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="form-label">Password</label>
          <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary">Login</button>
      </form>
    </div>
  )
}

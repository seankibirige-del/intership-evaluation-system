import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import API from '../services/api'

export default function Payments(){
  const { user } = useContext(AuthContext)
  const [payments, setPayments] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPayments = async () => {
      setError(null)
      try {
        const response = await API.get('payments/')
        setPayments(response.data)
      } catch (err) {
        setError('Unable to load payments.')
      } finally {
        setLoading(false)
      }
    }
    if (user) loadPayments()
    else setLoading(false)
  }, [user])

  const verifyPayment = async id => {
    setError(null)
    try {
      await API.post(`payments/${id}/verify/`)
      setPayments(prev => prev.map(payment => payment.id === id ? { ...payment, verified: true } : payment))
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to verify payment.')
    }
  }

  if (!user) {
    return (
      <div>
        <h2>Payments</h2>
        <p className="text-muted">Log in to view payment records.</p>
      </div>
    )
  }

  return (
    <div>
      <h2>Payments</h2>
      <p>Role: <strong>{user.role}</strong></p>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <p>Loading payments...</p>
      ) : payments.length ? (
        <div className="list-group">
          {payments.map(payment => (
            <div key={payment.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5>{payment.reference}</h5>
                  <p className="mb-1">Student ID: {payment.student}</p>
                  <p className="mb-1">Amount: ${payment.amount}</p>
                  <p className="mb-1">Verified: {payment.verified ? 'Yes' : 'No'}</p>
                </div>
                {(user.role === 'finance' || user.role === 'admin') && !payment.verified && (
                  <button className="btn btn-sm btn-success" onClick={() => verifyPayment(payment.id)}>Verify</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No payments found.</p>
      )}
    </div>
  )
}

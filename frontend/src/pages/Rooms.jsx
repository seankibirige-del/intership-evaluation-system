import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import API from '../services/api'

export default function Rooms(){
  const { user } = useContext(AuthContext)
  const [rooms, setRooms] = useState([])
  const [allocations, setAllocations] = useState([])
  const [studentId, setStudentId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setError(null)
      try {
        if (user.role === 'student') {
          const response = await API.get('room-allocations/')
          setAllocations(response.data)
        } else {
          const [roomsResponse, allocationsResponse] = await Promise.all([
            API.get('rooms/'),
            API.get('room-allocations/')
          ])
          setRooms(roomsResponse.data)
          setAllocations(allocationsResponse.data)
        }
      } catch (err) {
        setError('Unable to load room data.')
      } finally {
        setLoading(false)
      }
    }
    if (user) loadData()
    else setLoading(false)
  }, [user])

  const allocateRoom = async e => {
    e.preventDefault()
    setError(null)
    try {
      await API.post(`rooms/${roomId}/allocate/`, { student_id: studentId })
      const allocationsResponse = await API.get('room-allocations/')
      setAllocations(allocationsResponse.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to allocate room.')
    }
  }

  if (!user) {
    return (
      <div>
        <h2>Rooms</h2>
        <p className="text-muted">You must be logged in to access room data.</p>
      </div>
    )
  }

  return (
    <div>
      <h2>Room Allocation</h2>
      <p>Role: <strong>{user.role}</strong></p>
      {error && <div className="alert alert-danger">{error}</div>}
      {user.role !== 'student' && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Allocate Room</h5>
            <form onSubmit={allocateRoom} className="row g-2 align-items-end">
              <div className="col-md-4">
                <input className="form-control" placeholder="Room ID" value={roomId} onChange={e=>setRoomId(e.target.value)} />
              </div>
              <div className="col-md-4">
                <input className="form-control" placeholder="Student ID" value={studentId} onChange={e=>setStudentId(e.target.value)} />
              </div>
              <div className="col-md-4">
                <button className="btn btn-primary">Allocate</button>
              </div>
            </form>
            <p className="mt-2 text-muted">Use room and student IDs from the lists below.</p>
          </div>
        </div>
      )}
      {loading ? (
        <p>Loading room assignment data...</p>
      ) : (
        <>
          {user.role !== 'student' && (
            <div className="mb-4">
              <h5>Rooms</h5>
              <div className="list-group">
                {rooms.map(room => (
                  <div key={room.id} className="list-group-item">
                    <div className="d-flex justify-content-between">
                      <strong>{room.room_number}</strong>
                      <span>{room.occupancy}/{room.capacity}</span>
                    </div>
                    <p className="mb-0">Block: {room.block || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h5>Allocations</h5>
            {allocations.length ? (
              <div className="list-group">
                {allocations.map(item => (
                  <div key={item.id} className="list-group-item">
                    <div className="d-flex justify-content-between">
                      <strong>{item.room.room_number}</strong>
                      <small>{new Date(item.assigned_date).toLocaleString()}</small>
                    </div>
                    <p className="mb-1">Student: {item.student.student_number}</p>
                    <p className="mb-1">Assigned By: {item.assigned_by || 'System'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No room allocations available.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

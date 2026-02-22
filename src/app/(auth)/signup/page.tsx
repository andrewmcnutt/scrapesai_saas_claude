'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      setSuccess(true)
    } else {
      setError(data.error || 'Signup failed')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
          <p>We sent a verification link to {email}. Click the link to activate your account.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="max-w-md w-full p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Sign Up</h1>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <div className="mb-4">
          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
            minLength={6}
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Sign Up
        </button>

        <p className="mt-4 text-center">
          Already have an account? <a href="/login" className="text-blue-600">Log in</a>
        </p>
      </form>
    </div>
  )
}

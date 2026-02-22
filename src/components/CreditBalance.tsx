'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function CreditBalance() {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadBalance() {
      const { data: transactions, error } = await supabase
        .from('credit_transactions')
        .select('amount')

      if (error) {
        console.error('Failed to load balance:', error)
        setLoading(false)
        return
      }

      const total = transactions.reduce((sum, tx) => sum + tx.amount, 0)
      setBalance(total)
      setLoading(false)
    }

    loadBalance()
  }, [])

  if (loading) {
    return <div className="text-gray-600">Loading credits...</div>
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2">Credit Balance</h2>
      <p className="text-4xl font-bold text-blue-600">{balance ?? 0}</p>
      <p className="text-sm text-gray-600 mt-2">
        {balance === 0 ? 'No credits remaining' : `${balance} carousel${balance === 1 ? '' : 's'} available`}
      </p>
      {balance !== null && balance < 3 && (
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Get More Credits
        </button>
      )}
    </div>
  )
}

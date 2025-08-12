import React from 'react'

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
      <h2 className="mt-6 text-2xl font-light text-white">Wizone Field Engineer</h2>
      <p className="mt-2 text-white/80">Loading...</p>
    </div>
  )
}
import React from 'react'
import { RouterProvider } from "react-router"
import { router } from './App.routes.jsx'
import './index.css'
import { useAuth } from "../feature/auth/hook/useAuth.js"
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

function App() {
  const auth = useAuth()

  useEffect(() => {
    auth.handleGetMe()
  }, [])
  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1A1A1A',
          color: '#EEEEEE',
          border: '0.5px solid #2A2A2A',
        }
      }} />
      <RouterProvider router={router} />
    </>
  )
}

export default App
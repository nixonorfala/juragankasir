'use client'

import { useEffect } from 'react'
import Swal from 'sweetalert2'

export default function SweetAlertInitializer() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Override alert bawaan browser secara global
      window.alert = (message) => {
        Swal.fire({
          title: 'Pemberitahuan',
          text: String(message),
          icon: 'info',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'Oke',
        })
      }
    }
  }, [],)

  return null
}
import Swal from 'sweetalert2';

// Fungsi pengganti alert bawaan browser
export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  return Swal.fire({
    title,
    icon,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

export const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor: '#2563eb',
    confirmButtonText: 'Oke',
  });
};

export const showConfirm = async (title: string, text: string, confirmButtonText = 'Ya, Lanjutkan!') => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText: 'Batal',
  });
  return result.isConfirmed;
};
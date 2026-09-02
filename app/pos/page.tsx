'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../src/lib/supabase'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string
}

interface Addon {
  id: string
  name: string
  category: string
  additional_price: number
}

interface CartItem {
  cartId: string
  productId: string
  name: string
  basePrice: number
  selectedAddons: Addon[]
  finalPrice: number
  quantity: number
  stock: number
}

interface SavedBill {
  id: string
  name: string
  cart: CartItem[]
  created_at: string
}

interface TransactionItemDetail {
  product_name: string
  price: number
  quantity: number
}

interface TransactionHistory {
  id: string
  cashier_name: string
  total_amount: number
  discount_amount?: number
  payment_method: string
  cash_received: number
  change_amount: number
  note: string
  created_at: string
  transaction_items?: TransactionItemDetail[]
}

interface ShiftData {
  id: string
  opening_balance: number
  status: string
}

interface ExpenseItem {
  id: string
  description: string
  amount: number
  created_at: string
}

interface StoreSettings {
  name: string
  address: string
  phone: string
  receipt_footer: string
  tax_percentage: number
}

interface StaffMember {
  id: string
  name: string
}

interface AttendanceItem {
  id: string
  cashier_name: string
  status: string
  notes: string
  clock_in: string
}

export default function POS() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [storeId, setStoreId] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeInfo, setStoreInfo] = useState<StoreSettings>({
    name: 'Toko',
    address: '',
    phone: '',
    receipt_footer: '*** TERIMA KASIH ***',
    tax_percentage: 0
  })
  
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('')

  const [activeShift, setActiveShift] = useState<ShiftData | null>(null)
  const [isOpeningShiftModal, setIsOpeningShiftModal] = useState(false)
  const [openingBalanceInput, setOpeningBalanceInput] = useState<number | ''>('')
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('')
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([])

  const [isClosingShiftModal, setIsClosingShiftModal] = useState(false)
  const [closingCashInput, setClosingCashInput] = useState<number | ''>('')
  
  const [activeTab, setActiveTab] = useState<'pos' | 'history' | 'expenses' | 'stock' | 'attendance'>('pos')
  
  const [allShifts, setAllShifts] = useState<any[]>([])
  const [showShiftModal, setShowShiftModal] = useState(false)

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [attendanceStatus, setAttendanceStatus] = useState('Hadir')
  const [attendanceNotes, setAttendanceNotes] = useState('')
  const [attendancePin, setAttendancePin] = useState('')
  const [selectedStaffName, setSelectedStaffName] = useState('')
  const [storeStaffList, setStoreStaffList] = useState<StaffMember[]>([])
  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>([])

  const [products, setProducts] = useState<Product[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [historyList, setHistoryList] = useState<TransactionHistory[]>([])

  const [savedBills, setSavedBills] = useState<SavedBill[]>([])
  const [isSaveBillModalOpen, setIsSaveBillModalOpen] = useState(false)
  const [billNameInput, setBillNameInput] = useState('')
  const [isOpenBillModalOpen, setIsOpenBillModalOpen] = useState(false)

  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent')
  const [discountInput, setDiscountInput] = useState<number | ''>('')

  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedProductForAddon, setSelectedProductForAddon] = useState<{product: Product, availableAddons: Addon[]} | null>(null)
  const [chosenAddons, setChosenAddons] = useState<Addon[]>([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashReceived, setCashReceived] = useState<number | ''>('')
  const [orderNote, setOrderNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedReceipt, setSelectedReceipt] = useState<TransactionHistory | null>(null)
  const [closingReport, setClosingReport] = useState<any>(null)

  useEffect(() => {
    async function initPOS() {
      let currentStoreId = ''
      let currentUserName = ''

      const activeCashier = localStorage.getItem('juragankasir_active_cashier')
      if (activeCashier) {
        const cashierData = JSON.parse(activeCashier)
        currentStoreId = cashierData.store_id
        currentUserName = cashierData.name
        setStoreId(currentStoreId)
        setUserName(currentUserName)
        setUserRole('cashier')
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return router.push('/login')

        const { data: userData } = await supabase
          .from('users')
          .select('name, role, store_id')
          .eq('id', session.user.id)
          .single()

        if (!userData || (userData.role !== 'cashier' && userData.role !== 'owner')) return router.push('/login')

        currentStoreId = userData.store_id
        currentUserName = userData.name
        setStoreId(currentStoreId)
        setUserName(currentUserName)
        setUserRole(userData.role)
      }

      await fetchStoreDetails(currentStoreId)
      await checkActiveShift(currentStoreId, currentUserName)
      fetchProducts(currentStoreId)
      fetchAddons(currentStoreId)
      fetchSavedBills(currentStoreId)
      fetchStoreStaff(currentStoreId)
      fetchAttendanceRecords(currentStoreId)
      setLoading(false)
    }

    initPOS()
  }, [router])

  const fetchStoreDetails = async (sId: string) => {
    const { data: storeData } = await supabase
      .from('stores')
      .select('name, address, phone, receipt_footer, tax_percentage')
      .eq('id', sId)
      .single()

    if (storeData) {
      setStoreName(storeData.name || 'Toko')
      setStoreInfo({
        name: storeData.name || 'Toko',
        address: storeData.address || '',
        phone: storeData.phone || '',
        receipt_footer: storeData.receipt_footer || '*** TERIMA KASIH ***',
        tax_percentage: storeData.tax_percentage || 0
      })
    }
  }

  const fetchStoreStaff = async (sId: string) => {
    const { data } = await supabase
      .from('users')
      .select('id, name')
      .eq('store_id', sId)
      .order('name', { ascending: true })

    if (data && data.length > 0) {
      setStoreStaffList(data)
      setSelectedStaffName(data[0].name)
    }
  }

  const fetchAttendanceRecords = async (sId: string) => {
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('store_id', sId)
      .order('clock_in', { ascending: false })
      .limit(30)

    if (data) setAttendanceList(data)
  }

  const fetchSavedBills = async (sId: string) => {
    const { data } = await supabase
      .from('saved_bills')
      .select('*')
      .eq('store_id', sId)
      .order('created_at', { ascending: false })

    if (data) setSavedBills(data)
  }

  const checkActiveShift = async (sId: string, cashierName: string) => {
    const { data } = await supabase
      .from('shifts')
      .select('*')
      .eq('store_id', sId)
      .eq('cashier_name', cashierName)
      .eq('status', 'open')
      .single()

    if (data) {
      setActiveShift(data)
      fetchHistory(sId, cashierName, data.id)
      fetchExpenses(data.id)
    } else {
      setIsOpeningShiftModal(true)
    }
  }

  const sendTelegramNotification = async (msg: string) => {
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('telegram_chat_id')
        .eq('id', storeId)
        .single()

      if (storeData && storeData.telegram_chat_id) {
        await fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: storeData.telegram_chat_id, message: msg })
        })
      }
    } catch (err) {
      console.error('Gagal kirim notif Telegram:', err)
    }
  }

  const fetchAllShifts = async () => {
    if (!storeId) return
    const { data: shiftData } = await supabase
      .from('shift_schedules')
      .select('*')
      .eq('store_id', storeId)
      .order('shift_date', { ascending: true })

    if (shiftData) setAllShifts(shiftData)
    setShowShiftModal(true)
  }

  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (openingBalanceInput === '' || openingBalanceInput < 0) return

    const { data, error } = await supabase
      .from('shifts')
      .insert([{
        store_id: storeId,
        cashier_name: userName,
        opening_balance: Number(openingBalanceInput),
        status: 'open'
      }])
      .select()
      .single()

    if (!error && data) {
      setActiveShift(data)
      setIsOpeningShiftModal(false)
      setOpeningBalanceInput('')
      fetchHistory(storeId, userName, data.id)
      fetchExpenses(data.id)

      await sendTelegramNotification(`🔓 *SHIFT DIBUKA*\n\n🏪 Toko: ${storeName}\n👤 Kasir: ${userName}\n💵 Modal Awal: Rp ${Number(openingBalanceInput).toLocaleString('id-ID')}`)
    } else {
      alert('Gagal membuka shift: ' + (error?.message || 'Terjadi kesalahan'))
    }
  }

  const fetchProducts = async (sId: string) => {
    const { data } = await supabase.from('products').select('*').eq('store_id', sId).order('name', { ascending: true })
    if (data) setProducts(data)
  }

  const fetchAddons = async (sId: string) => {
    const { data } = await supabase.from('product_addons').select('*').eq('store_id', sId).order('name', { ascending: true })
    if (data) setAddons(data)
  }

  const fetchHistory = async (sId: string, cashierName: string, shiftId: string) => {
    const startTime = await getShiftStartTime(shiftId)
    const { data } = await supabase
      .from('transactions')
      .select(`*, transaction_items ( product_name, price, quantity )`)
      .eq('store_id', sId)
      .eq('cashier_name', cashierName)
      .gte('created_at', startTime)
      .order('created_at', { ascending: false })

    if (data) setHistoryList(data)
  }

  const getShiftStartTime = async (shiftId: string) => {
    const { data } = await supabase.from('shifts').select('created_at').eq('id', shiftId).single()
    return data ? data.created_at : new Date().toISOString()
  }

  const fetchExpenses = async (shiftId: string) => {
    const { data } = await supabase.from('cash_expenses').select('*').eq('shift_id', shiftId).order('created_at', { ascending: false })
    if (data) setExpensesList(data)
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeShift || expenseAmount === '' || !expenseDesc) return

    const { error } = await supabase.from('cash_expenses').insert([{
      shift_id: activeShift.id,
      store_id: storeId,
      description: expenseDesc,
      amount: Number(expenseAmount)
    }])

    if (!error) {
      setExpenseDesc('')
      setExpenseAmount('')
      setIsExpenseModalOpen(false)
      fetchExpenses(activeShift.id)
    }
  }

  const handleCloseShiftSubmit = async () => {
    if (!activeShift || closingCashInput === '') return

    const totalCashSales = historyList.filter(i => i.payment_method === 'cash').reduce((sum, i) => sum + i.total_amount, 0)
    const totalQrisSales = historyList.filter(i => i.payment_method !== 'cash').reduce((sum, i) => sum + i.total_amount, 0)
    const totalExpenses = expensesList.reduce((sum, i) => sum + i.amount, 0)

    const expectedCashInDrawer = activeShift.opening_balance + totalCashSales - totalExpenses
    const actualCash = Number(closingCashInput)
    const difference = actualCash - expectedCashInDrawer

    const itemSummary: { [name: string]: number } = {}
    historyList.forEach(trx => {
      if (trx.transaction_items) {
        trx.transaction_items.forEach(ti => {
          itemSummary[ti.product_name] = (itemSummary[ti.product_name] || 0) + ti.quantity
        })
      }
    })
    const itemsSoldArray = Object.entries(itemSummary).map(([name, qty]) => ({ name, qty }))

    const { error } = await supabase
      .from('shifts')
      .update({
        total_cash_sales: totalCashSales,
        total_qris_sales: totalQrisSales,
        total_expenses: totalExpenses,
        closing_balance: actualCash,
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('id', activeShift.id)

    if (!error) {
      const closedAtStr = new Date().toLocaleString('id-ID')
      setClosingReport({
        opening: activeShift.opening_balance,
        cashSales: totalCashSales,
        qrisSales: totalQrisSales,
        expenses: totalExpenses,
        expected: expectedCashInDrawer,
        actual: actualCash,
        diff: difference,
        closedAt: closedAtStr,
        itemsSold: itemsSoldArray,
        totalTransactions: historyList.length
      })
      setIsClosingShiftModal(false)
      setActiveShift(null)

      const itemsText = itemsSoldArray.map(i => `- ${i.qty}x ${i.name}`).join('\n')
      await sendTelegramNotification(
        `🔒 *SHIFT DITUTUP*\n\n` +
        `🏪 Toko: ${storeName}\n` +
        `👤 Kasir: ${userName}\n` +
        `💰 Tunai: Rp ${totalCashSales.toLocaleString('id-ID')}\n` +
        `💳 Non-Tunai: Rp ${totalQrisSales.toLocaleString('id-ID')}\n` +
        `📉 Keluar: Rp ${totalExpenses.toLocaleString('id-ID')}\n` +
        `💵 Faktual Laci: Rp ${actualCash.toLocaleString('id-ID')}\n` +
        `📊 Selisih: Rp ${difference.toLocaleString('id-ID')}\n\n` +
        `*Menu Terjual (${historyList.length} Transaksi):*\n${itemsText || 'Tidak ada penjualan'}`
      )
    }
  }

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!attendancePin || !selectedStaffName) return

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name, pin')
      .eq('store_id', storeId)
      .eq('name', selectedStaffName)
      .single()

    if (userError || !userData || userData.pin !== attendancePin) {
      alert('PIN Karyawan Salah!')
      return
    }

    const { error } = await supabase.from('attendance').insert([{
      store_id: storeId,
      cashier_name: selectedStaffName,
      status: attendanceStatus,
      notes: attendanceNotes,
      clock_in: new Date().toISOString()
    }])

    if (error) {
      alert('Gagal menyimpan absensi: ' + error.message)
    } else {
      alert(`Absensi untuk ${selectedStaffName} berhasil dicatat!`)
      setIsAttendanceModalOpen(false)
      setAttendancePin('')
      setAttendanceNotes('')
      fetchAttendanceRecords(storeId)
    }
  }

  const handleSaveBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!billNameInput.trim() || cart.length === 0) return

    const { error } = await supabase.from('saved_bills').insert([{
      store_id: storeId,
      name: billNameInput.trim(),
      cart: cart
    }])

    if (!error) {
      setCart([])
      setBillNameInput('')
      setIsSaveBillModalOpen(false)
      fetchSavedBills(storeId)
    } else {
      alert('Gagal menyimpan bill: ' + error.message)
    }
  }

  const handleRecallBill = async (bill: SavedBill) => {
    if (cart.length > 0) {
      const confirmSwap = confirm('Keranjang saat ini ada isinya. Timpa dengan pesanan tersimpan ini?')
      if (!confirmSwap) return
    }
    setCart(bill.cart)

    const { error } = await supabase.from('saved_bills').delete().eq('id', bill.id)
    if (!error) {
      fetchSavedBills(storeId)
      setIsOpenBillModalOpen(false)
    }
  }

  const handleDeleteSavedBill = async (id: string) => {
    const confirmDel = confirm('Hapus pesanan tersimpan ini?')
    if (confirmDel) {
      const { error } = await supabase.from('saved_bills').delete().eq('id', id)
      if (!error) fetchSavedBills(storeId)
    }
  }

  const handleProductClick = (product: Product) => {
    if (product.stock <= 0) {
      alert('Produk habis!')
      return
    }
    
    const available = addons.filter(a => {
      const addonCat = (a.category || '').toUpperCase()
      const prodCat = (product.category || 'UMUM').toUpperCase()
      return addonCat === prodCat || addonCat === 'SEMUA'
    })

    if (available.length > 0) {
      setSelectedProductForAddon({ product, availableAddons: available })
      setChosenAddons([])
    } else {
      processAddToCart(product, [])
    }
  }

  const toggleAddonSelection = (addon: Addon) => {
    setChosenAddons(prev => {
      const exists = prev.find(a => a.id === addon.id)
      if (exists) return prev.filter(a => a.id !== addon.id)
      return [...prev, addon]
    })
  }

  const processAddToCart = (product: Product, selectedAddons: Addon[]) => {
    const addonPrice = selectedAddons.reduce((sum, a) => sum + a.additional_price, 0)
    const finalPrice = product.price + addonPrice
    const addonIds = selectedAddons.map(a => a.id).sort().join('-')
    const cartId = `${product.id}-${addonIds}`

    setCart(prevCart => {
      const existing = prevCart.find(item => item.cartId === cartId)
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Stok produk tidak mencukupi!')
          return prevCart
        }
        return prevCart.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prevCart, { 
        cartId, 
        productId: product.id, 
        name: product.name, 
        basePrice: product.price, 
        selectedAddons, 
        finalPrice, 
        quantity: 1, 
        stock: product.stock 
      }]
    })
  }

  const confirmAddToCartWithAddons = () => {
    if (!selectedProductForAddon) return
    processAddToCart(selectedProductForAddon.product, chosenAddons)
    setSelectedProductForAddon(null)
  }

  const increaseQuantity = (cartId: string) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartId === cartId) {
        if (item.quantity >= item.stock) {
          alert('Stok maksimal tercapai!')
          return item
        }
        return { ...item, quantity: item.quantity + 1 }
      }
      return item
    }))
  }

  const decreaseQuantity = (cartId: string) => {
    setCart(prevCart => prevCart.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0))
  }

  const removeFromCart = (cartId: string) => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId))
  }

  const getSubtotalPrice = () => {
    return cart.reduce((total, item) => total + (item.finalPrice * item.quantity), 0)
  }

  const getDiscountAmount = () => {
    const subtotal = getSubtotalPrice()
    if (typeof discountInput !== 'number' || discountInput <= 0) return 0
    if (discountType === 'percent') {
      const val = Math.min(discountInput, 100)
      return Math.round((subtotal * val) / 100)
    } else {
      return Math.min(discountInput, subtotal)
    }
  }

  const getTaxAmount = () => {
    const subtotal = getSubtotalPrice()
    const discount = getDiscountAmount()
    const discountedSubtotal = Math.max(0, subtotal - discount)
    if (!storeInfo.tax_percentage || storeInfo.tax_percentage <= 0) return 0
    return Math.round((discountedSubtotal * storeInfo.tax_percentage) / 100)
  }

  const getTotalPrice = () => {
    const subtotal = getSubtotalPrice()
    const discount = getDiscountAmount()
    const tax = getTaxAmount()
    return Math.max(0, subtotal - discount + tax)
  }

  const handleOpenModal = () => {
    if (cart.length === 0) return
    setIsModalOpen(true)
    setPaymentMethod('cash')
    setCashReceived('')
    setOrderNote('')
    setDiscountInput('')
    setDiscountType('percent')
  }

  const handleConfirmPayment = async () => {
    const total = getTotalPrice()
    const discountAmt = getDiscountAmount()
    const received = Number(cashReceived)
    const change = paymentMethod === 'cash' ? received - total : 0
    
    if (paymentMethod === 'cash' && received < total) {
      alert('Uang yang diterima kurang dari total tagihan!')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: trxData, error: trxError } = await supabase
        .from('transactions')
        .insert([{
          store_id: storeId,
          cashier_name: userName,
          total_amount: total,
          discount_amount: discountAmt,
          payment_method: paymentMethod,
          cash_received: paymentMethod === 'cash' ? received : 0,
          change_amount: change > 0 ? change : 0,
          note: orderNote
        }])
        .select()
        .single()

      if (trxError) throw trxError

      const itemsToInsert = cart.map(item => {
        const addonNames = item.selectedAddons.map(a => a.name).join(', ')
        const displayName = addonNames ? `${item.name} (${addonNames})` : item.name 
        return { 
          transaction_id: trxData.id, 
          product_id: item.productId, 
          product_name: displayName, 
          price: item.finalPrice, 
          quantity: item.quantity 
        }
      })

      const { error: itemsError } = await supabase.from('transaction_items').insert(itemsToInsert)
      if (itemsError) throw itemsError

      for (const item of cart) {
        const prod = products.find(p => p.id === item.productId)
        if (prod) {
          await supabase.from('products').update({ stock: prod.stock - item.quantity }).eq('id', item.productId)
        }
      }

      setCart([]) 
      setIsModalOpen(false)
      fetchProducts(storeId)
      if (activeShift) fetchHistory(storeId, userName, activeShift.id)

      try {
        const { data: storeData } = await supabase
          .from('stores')
          .select('telegram_chat_id, name')
          .eq('id', storeId)
          .single()

        if (storeData && storeData.telegram_chat_id) {
          const itemsText = cart.map(i => `- ${i.quantity}x ${i.name}`).join('\n')
          const message = `🔔 *TRANSAKSI BERHASIL* 🔔\n\n🏪 Toko: ${storeData.name}\n💰 Total: Rp ${total.toLocaleString('id-ID')}\n💳 Metode: ${paymentMethod.toUpperCase()}\n\n*Item Pesanan:*\n${itemsText}`

          await fetch('/api/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: storeData.telegram_chat_id,
              message: message
            })
          })

          let lowStockAlert = ''
          for (const item of cart) {
            const prod = products.find(p => p.id === item.productId)
            if (prod) {
              const remainingStock = prod.stock - item.quantity
              if (remainingStock <= 5) {
                lowStockAlert += `\n⚠️ *Stok Menipis:* ${prod.name} sisa ${remainingStock} pcs!`
              }
            }
          }
          if (lowStockAlert) {
            await fetch('/api/telegram', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: storeData.telegram_chat_id,
                message: lowStockAlert
              })
            })
          }
        }
      } catch (tgError) {
        console.error('Gagal kirim notifikasi Telegram:', tgError)
      }

      setSelectedReceipt({
        id: trxData.id,
        cashier_name: userName,
        total_amount: total,
        discount_amount: discountAmt,
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'cash' ? received : 0,
        change_amount: change > 0 ? change : 0,
        note: orderNote,
        created_at: new Date().toISOString(),
        transaction_items: itemsToInsert
      })

    } catch (error: any) {
      alert('Gagal memproses transaksi: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => window.print()
  
  const handleLogout = async () => { 
    localStorage.removeItem('juragankasir_active_cashier')
    await supabase.auth.signOut()
    router.push('/login') 
  }

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-gray-100">Menyiapkan Mesin Kasir...</div>

  const categories = ['Semua', ...Array.from(new Set(products.map(p => (p.category ? p.category.toUpperCase() : 'UMUM'))))]

  const filteredProducts = products.filter(p => {
    const productCat = (p.category || 'UMUM').toUpperCase()
    const matchCategory = selectedCategory === 'Semua' || productCat === selectedCategory.toUpperCase()
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  const subtotalPrice = getSubtotalPrice()
  const discountAmount = getDiscountAmount()
  const taxAmount = getTaxAmount()
  const totalPrice = getTotalPrice()
  const change = paymentMethod === 'cash' && typeof cashReceived === 'number' ? cashReceived - totalPrice : 0

  const currentCashSales = historyList.filter(i => i.payment_method === 'cash').reduce((sum, i) => sum + i.total_amount, 0)
  const currentQrisSales = historyList.filter(i => i.payment_method !== 'cash').reduce((sum, i) => sum + i.total_amount, 0)
  const currentExpenses = expensesList.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden font-sans text-gray-900 relative">
      
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-55 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE TOP NAVBAR */}
      <div className="md:hidden h-14 bg-blue-800 text-white flex items-center justify-between px-4 z-30 flex-shrink-0 border-b border-blue-700 shadow-sm">
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-blue-700 rounded-lg hover:bg-blue-600 focus:outline-none">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <span className="font-bold text-sm truncate">{storeName}</span>
        </div>
        <span className="text-xs bg-blue-700 px-3 py-1 rounded-full font-medium">{userName}</span>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* SIDEBAR DRAWER RESPONSIF */}
        <aside className={`bg-blue-800 text-white flex flex-col transition-all duration-300 shadow-xl z-50 print:hidden fixed md:relative inset-y-0 left-0 ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'} ${isSidebarCollapsed ? 'md:w-20' : 'md:w-72'} w-72 h-full flex-shrink-0`}>
          <div className="h-16 hidden md:flex items-center justify-between px-4 border-b border-blue-700">
            {!isSidebarCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="text-lg font-bold truncate">{storeName}</h1>
                <p className="text-xs text-blue-200">Mode Kasir</p>
              </div>
            )}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 bg-blue-700 rounded-lg hover:bg-blue-600 focus:outline-none mx-auto">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>

          {/* Header khusus mobile di dalam drawer */}
          <div className="md:hidden h-16 flex items-center justify-between px-4 border-b border-blue-700 bg-blue-900">
            <div>
              <h1 className="text-base font-bold truncate">{storeName}</h1>
              <p className="text-xs text-blue-200">Menu Navigasi Kasir</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 bg-blue-800 rounded-full text-white font-bold flex items-center justify-center">✕</button>
          </div>

          <nav className="flex-1 py-4 space-y-1.5 px-3 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button onClick={() => { setActiveTab('pos'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-colors ${activeTab === 'pos' ? 'bg-blue-600 shadow-sm' : 'hover:bg-blue-700 text-blue-100'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              {(!isSidebarCollapsed || window.innerWidth < 768) && <span className="ml-3 font-medium whitespace-nowrap text-sm">Mesin Kasir (POS)</span>}
            </button>
            
            <button onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-colors ${activeTab === 'history' ? 'bg-blue-600 shadow-sm' : 'hover:bg-blue-700 text-blue-100'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {(!isSidebarCollapsed || window.innerWidth < 768) && <span className="ml-3 font-medium whitespace-nowrap text-sm">Riwayat Transaksi</span>}
            </button>

            <button onClick={() => { setActiveTab('stock'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-colors ${activeTab === 'stock' ? 'bg-blue-600 shadow-sm' : 'hover:bg-blue-700 text-blue-100'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              {(!isSidebarCollapsed || window.innerWidth < 768) && <span className="ml-3 font-medium whitespace-nowrap text-sm">Cek Stok Barang</span>}
            </button>

            <button onClick={() => { setActiveTab('expenses'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-colors ${activeTab === 'expenses' ? 'bg-blue-600 shadow-sm' : 'hover:bg-blue-700 text-blue-100'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {(!isSidebarCollapsed || window.innerWidth < 768) && <span className="ml-3 font-medium whitespace-nowrap text-sm">Pengeluaran ({expensesList.length})</span>}
            </button>

            <button onClick={() => { setActiveTab('attendance'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-colors ${activeTab === 'attendance' ? 'bg-blue-600 shadow-sm' : 'hover:bg-blue-700 text-blue-100'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              {(!isSidebarCollapsed || window.innerWidth < 768) && <span className="ml-3 font-medium whitespace-nowrap text-sm">Absensi Karyawan</span>}
            </button>

            {(!isSidebarCollapsed || window.innerWidth < 768) && activeShift && (
              <div className="mt-6 mb-4 p-3 bg-blue-900 rounded-xl border border-blue-700 shadow-inner">
                <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-2">Ringkasan Shift Live</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200">Tunai</span>
                    <span className="font-semibold">Rp {currentCashSales.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200">Non-Tunai</span>
                    <span className="font-semibold">Rp {currentQrisSales.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-blue-800 pt-1.5">
                    <span className="text-blue-200">Keluar</span>
                    <span className="font-semibold text-red-300">- Rp {currentExpenses.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            )}
          </nav>

          <div className="p-3 border-t border-blue-700 space-y-2">
            {(!isSidebarCollapsed || window.innerWidth < 768) && (
              <div className="flex items-center space-x-3 mb-2 p-2 bg-blue-700 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs">{userName.charAt(0)}</div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold truncate">{userName}</p>
                  <p className="text-[9px] text-blue-200 uppercase tracking-wider">Kasir Aktif</p>
                </div>
              </div>
            )}

            <button onClick={fetchAllShifts} className="w-full flex items-center justify-center p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition text-xs shadow-sm">
              {(!isSidebarCollapsed || window.innerWidth < 768) ? '📅 Jadwal Shift Toko' : '📅'}
            </button>
            
            <button onClick={() => setIsExpenseModalOpen(true)} className="w-full flex items-center justify-center p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition text-xs">
              {(!isSidebarCollapsed || window.innerWidth < 768) ? '+ Kas Keluar' : '+'}
            </button>
            
            <button onClick={() => setIsClosingShiftModal(true)} className="w-full flex items-center justify-center p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition text-xs">
              {(!isSidebarCollapsed || window.innerWidth < 768) ? 'Tutup Shift' : 'X'}
            </button>

            {userRole === 'owner' && (
              <button onClick={() => router.push('/dashboard')} className="w-full flex items-center justify-center p-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-medium transition text-xs">
                {(!isSidebarCollapsed || window.innerWidth < 768) ? 'Dashboard Owner' : 'Dash'}
              </button>
            )}

            <button onClick={handleLogout} className="w-full flex items-center justify-center p-2 bg-transparent border border-blue-500 hover:bg-blue-700 text-white rounded-lg font-medium transition text-xs">
              {(!isSidebarCollapsed || window.innerWidth < 768) ? 'Keluar Akun' : 'Out'}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col h-full overflow-hidden print:overflow-visible">
          {activeTab === 'pos' ? (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full print:hidden">
              
              <div className="flex-1 p-3 md:p-6 flex flex-col overflow-hidden bg-gray-50/50">
                <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-3 md:mb-6">
                  
                  <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {categories.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)} 
                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  
                  <div className="w-full md:w-72">
                    <div className="relative">
                      <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        placeholder="Cari nama menu..." 
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-4 pr-1 content-start pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {filteredProducts.length === 0 ? (
                    <p className="text-gray-400 col-span-full text-center py-12 text-sm">Tidak ada menu yang ditemukan.</p>
                  ) : (
                    filteredProducts.map(product => (
                      <button 
                        key={product.id} 
                        onClick={() => handleProductClick(product)} 
                        disabled={product.stock <= 0} 
                        className={`p-3 md:p-4 rounded-xl border text-left flex flex-col h-full transition-all ${product.stock <= 0 ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'bg-white hover:border-blue-400 hover:shadow-sm'}`}
                      >
                        <span className="text-[10px] font-medium text-gray-400 uppercase mb-1 tracking-wider">{product.category || 'Umum'}</span>
                        <span className="font-semibold text-gray-700 flex-1 text-xs md:text-sm leading-snug mb-2 md:mb-3">{product.name}</span>
                        
                        <div className="mt-auto flex justify-between items-center w-full">
                          <span className="text-blue-600 font-bold text-xs md:text-sm">Rp {product.price.toLocaleString('id-ID')}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${product.stock <= 0 ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>Stok: {product.stock}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* PANEL KERANJANG & OPEN BILL */}
              <div className="w-full md:w-[320px] lg:w-[360px] bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col shadow-xl z-10 max-h-[38vh] md:max-h-full">
                <div className="p-3 md:p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                  <h2 className="text-sm md:text-base font-bold text-gray-800 flex items-center gap-2">
                    <span>Pesanan</span>
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-semibold">{cart.length}</span>
                  </h2>
                  
                  <button 
                    onClick={() => setIsOpenBillModalOpen(true)}
                    className="relative text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition flex items-center gap-1"
                  >
                    <span>Bill Simpan</span>
                    {savedBills.length > 0 && (
                      <span className="w-4 h-4 bg-amber-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                        {savedBills.length}
                      </span>
                    )}
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 bg-gray-50/30 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs md:text-sm text-center py-4 md:py-0">
                      <svg className="w-8 h-8 md:w-10 md:h-10 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                      Belum ada pesanan.<br/>Pilih menu di sebelah kiri.
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.cartId} className="bg-white p-2.5 md:p-3 rounded-xl border border-gray-100 shadow-sm space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-700 text-xs md:text-sm leading-tight">{item.name}</p>
                            {item.selectedAddons.length > 0 && (
                              <p className="text-[10px] text-blue-500 font-medium mt-0.5 bg-blue-50 inline-block px-1.5 py-0.5 rounded">
                                +{item.selectedAddons.map(a => a.name).join(', +')}
                              </p>
                            )}
                          </div>
                          <button onClick={() => removeFromCart(item.cartId)} className="text-[10px] text-red-400 hover:text-red-600 font-semibold p-1">Hapus</button>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-gray-50">
                          <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 rounded-md p-0.5">
                            <button onClick={() => decreaseQuantity(item.cartId)} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-gray-500 hover:bg-white rounded font-bold text-xs">-</button>
                            <span className="text-xs font-semibold text-gray-700 w-5 text-center">{item.quantity}</span>
                            <button onClick={() => increaseQuantity(item.cartId)} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-gray-500 hover:bg-white rounded font-bold text-xs">+</button>
                          </div>
                          <p className="font-bold text-gray-800 text-xs md:text-sm">Rp {(item.finalPrice * item.quantity).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 md:p-4 border-t border-gray-100 bg-white space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span>Rp {subtotalPrice.toLocaleString('id-ID')}</span>
                  </div>
                  {storeInfo.tax_percentage > 0 && (
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Pajak ({storeInfo.tax_percentage}%)</span>
                      <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end pt-1.5 border-t border-gray-100 mb-2">
                    <span className="text-gray-700 font-bold text-xs md:text-sm">Total Tagihan</span>
                    <span className="text-lg md:text-xl font-bold text-blue-600">Rp {totalPrice.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setIsSaveBillModalOpen(true)} 
                      disabled={cart.length === 0} 
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-xl shadow-sm transition-all text-xs"
                    >
                      Simpan Bill
                    </button>
                    <button 
                      onClick={handleOpenModal} 
                      disabled={cart.length === 0} 
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-xl shadow-sm transition-all text-xs"
                    >
                      Bayar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'stock' ? (
            <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl mx-auto w-full print:hidden">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-800">Informasi Stok Menu & Produk</h2>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs font-medium uppercase tracking-wider border-b">
                      <th className="p-3 md:p-4">Kategori</th>
                      <th className="p-3 md:p-4">Nama Menu</th>
                      <th className="p-3 md:p-4">Harga Jual</th>
                      <th className="p-3 md:p-4 text-center">Sisa Stok</th>
                      <th className="p-3 md:p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 text-xs md:text-sm">
                    {products.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-400">Belum ada menu terdaftar.</td></tr>
                    ) : (
                      products.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="p-3 md:p-4">
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">
                              {p.category || 'UMUM'}
                            </span>
                          </td>
                          <td className="p-3 md:p-4 font-semibold text-gray-800">{p.name}</td>
                          <td className="p-3 md:p-4 font-medium text-gray-600">Rp {p.price.toLocaleString('id-ID')}</td>
                          <td className="p-3 md:p-4 text-center font-bold text-gray-800">{p.stock}</td>
                          <td className="p-3 md:p-4 text-center">
                            {p.stock <= 0 ? (
                              <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">Habis</span>
                            ) : p.stock <= 5 ? (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase">Menipis</span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Aman</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl mx-auto w-full print:hidden">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6">Riwayat Transaksi Shift</h2>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs font-medium uppercase tracking-wider border-b">
                      <th className="p-3 md:p-4">Waktu</th>
                      <th className="p-3 md:p-4">Metode</th>
                      <th className="p-3 md:p-4 w-1/3">Item Pesanan</th>
                      <th className="p-3 md:p-4">Catatan</th>
                      <th className="p-3 md:p-4 text-right">Total Pendapatan</th>
                      <th className="p-3 md:p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 text-xs md:text-sm">
                    {historyList.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">Belum ada transaksi.</td></tr> : historyList.map(trx => (
                      <tr key={trx.id} className="hover:bg-gray-50">
                        <td className="p-3 md:p-4 font-medium">{new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="p-3 md:p-4"><span className="text-xs font-semibold text-blue-600 uppercase bg-blue-50 rounded px-2 py-0.5">{trx.payment_method}</span></td>
                        <td className="p-3 md:p-4">
                          {trx.transaction_items && trx.transaction_items.length > 0 ? (
                            <ul className="text-xs text-gray-600 space-y-1">
                              {trx.transaction_items.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="font-bold text-blue-700 bg-blue-100 px-1 py-0.5 rounded">{item.quantity}x</span> 
                                  <span>{item.product_name}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="italic text-gray-400 text-xs">Tidak ada rincian</span>
                          )}
                        </td>
                        <td className="p-3 md:p-4 text-gray-500 italic">{trx.note || '-'}</td>
                        <td className="p-3 md:p-4 font-bold text-right text-gray-800">Rp {trx.total_amount.toLocaleString('id-ID')}</td>
                        <td className="p-3 md:p-4 text-center">
                          <button onClick={() => setSelectedReceipt(trx)} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm">Lihat / Cetak</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'attendance' ? (
            <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full print:hidden space-y-4 md:space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">Modul Absensi Karyawan</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Cek riwayat kehadiran di bawah untuk memastikan absensi Anda sudah terekam.</p>
                </div>
                <button onClick={() => setIsAttendanceModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-medium shadow-sm transition-colors">+ Catat Kehadiran / Absen</button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <div className="p-3 md:p-4 bg-gray-50 border-b border-gray-200 font-semibold text-xs md:text-sm text-gray-700">
                  Riwayat Absensi Kehadiran Terbaru
                </div>
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-500 text-xs font-medium uppercase tracking-wider border-b">
                      <th className="p-3 md:p-4">Nama Karyawan</th>
                      <th className="p-3 md:p-4">Status</th>
                      <th className="p-3 md:p-4">Waktu Absen</th>
                      <th className="p-3 md:p-4">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 text-xs md:text-sm">
                    {attendanceList.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada riwayat absensi tercatat.</td></tr>
                    ) : (
                      attendanceList.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-3 md:p-4 font-semibold text-gray-800">{item.cashier_name}</td>
                          <td className="p-3 md:p-4">
                            <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${item.status === 'Hadir' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 md:p-4 text-gray-600">{new Date(item.clock_in).toLocaleString('id-ID')}</td>
                          <td className="p-3 md:p-4 text-gray-500 italic">{item.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full print:hidden">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-800">Daftar Pengeluaran Kas</h2>
                <button onClick={() => setIsExpenseModalOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-medium shadow-sm transition-colors">+ Tambah Pengeluaran</button>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[450px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs font-medium uppercase tracking-wider border-b">
                      <th className="p-3 md:p-4">Waktu</th>
                      <th className="p-3 md:p-4">Keterangan</th>
                      <th className="p-3 md:p-4 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 text-xs md:text-sm">
                    {expensesList.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-gray-400">Belum ada pengeluaran kas.</td></tr> : expensesList.map(exp => (
                      <tr key={exp.id} className="hover:bg-gray-50">
                        <td className="p-3 md:p-4 font-medium">{new Date(exp.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="p-3 md:p-4 font-medium">{exp.description}</td>
                        <td className="p-3 md:p-4 font-bold text-right text-red-500">- Rp {exp.amount.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL JADWAL SHIFT SELURUH TOKO */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 md:p-5 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm md:text-base font-bold">Jadwal Shift Seluruh Karyawan</h3>
                <p className="text-xs text-blue-100 mt-0.5">Toko: <strong>{storeName}</strong></p>
              </div>
              <button onClick={() => setShowShiftModal(false)} className="w-8 h-8 bg-blue-700 rounded-full text-white font-bold flex items-center justify-center">✕</button>
            </div>
            <div className="p-4 md:p-5 space-y-3 overflow-y-auto flex-1">
              {allShifts.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Belum ada jadwal shift yang ditambahkan.</p>
              ) : (
                allShifts.map(s => (
                  <div key={s.id} className="p-3.5 border rounded-xl flex justify-between items-center bg-gray-50">
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{s.employee_name}</p>
                      <p className="text-xs font-semibold text-gray-800 mt-0.5">{s.shift_date}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        {s.is_off_day ? 'LIBUR' : `${s.start_time} - ${s.end_time}`}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${s.is_off_day ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {s.is_off_day ? 'OFF' : 'MASUK'}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 md:p-4 bg-gray-50 border-t text-center">
              <button 
                onClick={() => setShowShiftModal(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {isAttendanceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 md:p-5 bg-blue-600 text-white">
              <h2 className="text-base md:text-lg font-bold">Form Absensi Karyawan</h2>
              <p className="text-xs text-blue-100 mt-1">Pilih nama staf dan masukkan PIN rahasia.</p>
            </div>
            <form onSubmit={handleAttendanceSubmit} className="p-4 md:p-5 space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Nama Karyawan / Staf</label>
                <select 
                  value={selectedStaffName} 
                  onChange={(e) => setSelectedStaffName(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 border rounded-lg text-xs md:text-sm bg-white outline-none text-gray-800 font-semibold"
                >
                  {storeStaffList.map(staff => (
                    <option key={staff.id} value={staff.name}>{staff.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Status Kehadiran</label>
                <select 
                  value={attendanceStatus} 
                  onChange={(e) => setAttendanceStatus(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 border rounded-lg text-xs md:text-sm bg-white outline-none text-gray-800 font-semibold"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                  <option value="Libur">Libur</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">
                  {`PIN Karyawan (${selectedStaffName || 'Pilih Staf'})`}
                </label>
                <input 
                  type="password" 
                  required 
                  maxLength={6}
                  value={attendancePin} 
                  onChange={(e) => setAttendancePin(e.target.value)} 
                  placeholder="Masukkan PIN..." 
                  className="w-full px-3 md:px-4 py-2 border rounded-lg outline-none text-gray-800 text-sm font-semibold" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Catatan (Opsional)</label>
                <input 
                  type="text" 
                  value={attendanceNotes} 
                  onChange={(e) => setAttendanceNotes(e.target.value)} 
                  placeholder="Keterangan tambahan..." 
                  className="w-full px-3 md:px-4 py-2 border rounded-lg outline-none text-gray-800 text-xs md:text-sm" 
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setIsAttendanceModalOpen(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-gray-600 text-xs font-medium">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm">Simpan Absensi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSaveBillModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 md:p-5 bg-amber-500 text-white">
              <h2 className="text-base md:text-lg font-bold">Simpan Pesanan (Open Bill)</h2>
              <p className="text-xs text-amber-100 mt-1">Beri nama meja atau nama pelanggan.</p>
            </div>
            <form onSubmit={handleSaveBillSubmit} className="p-4 md:p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Nama Meja / Pelanggan</label>
                <input 
                  type="text" 
                  required 
                  value={billNameInput} 
                  onChange={(e) => setBillNameInput(e.target.value)} 
                  placeholder="Contoh: Meja 3 / Budi" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none text-gray-800 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setIsSaveBillModalOpen(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-gray-600 text-xs font-medium">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm">Simpan Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isOpenBillModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 md:p-5 bg-amber-500 text-white flex justify-between items-center">
              <div>
                <h2 className="text-base md:text-lg font-bold">Daftar Bill Tersimpan</h2>
                <p className="text-xs text-amber-100 mt-1">Pilih bill untuk ditarik kembali ke keranjang.</p>
              </div>
              <button onClick={() => setIsOpenBillModalOpen(false)} className="w-8 h-8 bg-amber-600 rounded-full text-white font-bold flex items-center justify-center">✕</button>
            </div>
            <div className="p-4 md:p-5 space-y-3 overflow-y-auto flex-1">
              {savedBills.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Tidak ada pesanan yang sedang disimpan.</p>
              ) : (
                savedBills.map(bill => {
                  const billTotal = bill.cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0)
                  return (
                    <div key={bill.id} className="p-3 md:p-4 rounded-xl border border-gray-200 hover:border-amber-400 bg-gray-50/50 flex justify-between items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800 text-xs md:text-sm">{bill.name}</span>
                          <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded border">
                            {new Date(bill.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{bill.cart.length} Item • <strong className="text-amber-600">Rp {billTotal.toLocaleString('id-ID')}</strong></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDeleteSavedBill(bill.id)} className="px-2.5 py-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-semibold">Hapus</button>
                        <button onClick={() => handleRecallBill(bill)} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm">Pilih</button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {selectedProductForAddon && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 md:p-5 bg-blue-600 text-white">
              <h2 className="text-base md:text-lg font-bold">Kustomisasi Menu</h2>
              <p className="text-xs text-blue-100 mt-1">{selectedProductForAddon.product.name} - Rp {selectedProductForAddon.product.price.toLocaleString('id-ID')}</p>
            </div>
            <div className="p-4 md:p-5 space-y-3 max-h-96 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pilih Varian (Opsional)</p>
              <div className="space-y-2">
                {selectedProductForAddon.availableAddons.map(addon => {
                  const isSelected = chosenAddons.some(a => a.id === addon.id)
                  return (
                    <button 
                      key={addon.id} 
                      type="button" 
                      onClick={() => toggleAddonSelection(addon)} 
                      className={`w-full flex justify-between items-center p-3 rounded-xl border text-left transition-all ${isSelected ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <span className="text-xs md:text-sm">{addon.name}</span>
                      <span className="text-xs md:text-sm text-blue-600 font-bold">
                        +{addon.additional_price > 0 ? `Rp ${addon.additional_price.toLocaleString('id-ID')}` : 'Gratis'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="p-3 md:p-4 bg-gray-50 border-t flex space-x-3">
              <button onClick={() => setSelectedProductForAddon(null)} className="flex-1 px-4 py-2 border rounded-lg text-gray-700 text-xs font-medium">Batal</button>
              <button onClick={confirmAddToCartWithAddons} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">Tambah ke Pesanan</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 md:p-5 border-b border-gray-100 flex-shrink-0"><h2 className="text-base md:text-lg font-bold text-gray-800">Konfirmasi Pembayaran & Diskon</h2></div>
            <div className="p-4 md:p-5 space-y-4 overflow-y-auto flex-1">
              
              <div className="bg-blue-50/50 p-3 md:p-4 rounded-xl text-center border border-blue-50 space-y-1">
                <p className="text-xs text-blue-500 font-medium">Total Tagihan Akhir</p>
                <p className="text-xl md:text-2xl font-bold text-blue-700">Rp {totalPrice.toLocaleString('id-ID')}</p>
                <div className="text-[11px] text-gray-500 pt-1 space-x-2">
                  <span>Subtotal: Rp {subtotalPrice.toLocaleString('id-ID')}</span>
                  {discountAmount > 0 && <span className="text-red-500 font-semibold">| Diskon: -Rp {discountAmount.toLocaleString('id-ID')}</span>}
                  {taxAmount > 0 && <span>| Pajak: Rp {taxAmount.toLocaleString('id-ID')}</span>}
                </div>
              </div>

              <div className="p-3 md:p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-amber-800 uppercase tracking-wider">Diskon / Potongan Harga</label>
                  <div className="flex bg-white border border-amber-200 rounded-lg p-0.5 text-xs font-semibold">
                    <button 
                      type="button" 
                      onClick={() => setDiscountType('percent')} 
                      className={`px-3 py-1 rounded-md transition ${discountType === 'percent' ? 'bg-amber-500 text-white' : 'text-gray-600'}`}
                    >
                      % Persen
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setDiscountType('amount')} 
                      className={`px-3 py-1 rounded-md transition ${discountType === 'amount' ? 'bg-amber-500 text-white' : 'text-gray-600'}`}
                    >
                      Rp Nominal
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    min={0}
                    value={discountInput} 
                    onChange={(e) => setDiscountInput(e.target.value === '' ? '' : Number(e.target.value))} 
                    placeholder={discountType === 'percent' ? 'Masukkan angka 0 - 100' : 'Masukkan nominal rupiah'} 
                    className="w-full px-3 md:px-4 py-2.5 bg-white border border-amber-200 rounded-lg text-xs md:text-sm text-gray-800 font-semibold outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPaymentMethod('cash')} className={`py-2 px-3 border rounded-lg text-xs md:text-sm font-medium transition-colors ${paymentMethod === 'cash' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>Tunai</button>
                  <button onClick={() => setPaymentMethod('debit')} className={`py-2 px-3 border rounded-lg text-xs md:text-sm font-medium transition-colors ${paymentMethod === 'debit' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>Debit / Non-Tunai</button>
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className="space-y-3 p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">UANG DITERIMA (RP)</label>
                    <input 
                      type="number" 
                      value={cashReceived} 
                      onChange={(e) => setCashReceived(e.target.value === '' ? '' : Number(e.target.value))} 
                      placeholder="0" 
                      className="w-full px-3 md:px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-sm md:text-base font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" 
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-xs md:text-sm font-medium text-gray-500">Kembalian</span>
                    <span className={`text-base md:text-lg font-bold ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {change < 0 ? 'Uang Kurang' : `Rp ${change.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Catatan Pesanan</label>
                <input 
                  type="text" 
                  value={orderNote} 
                  onChange={(e) => setOrderNote(e.target.value)} 
                  placeholder="Es dipisah, less sugar..." 
                  className="w-full px-3 md:px-4 py-2 border border-gray-200 rounded-lg text-xs md:text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-100 flex space-x-3 flex-shrink-0">
              <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="flex-1 px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-gray-600 font-medium hover:bg-gray-100 text-xs md:text-sm">Batal</button>
              <button onClick={handleConfirmPayment} disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm text-xs md:text-sm">
                {isSubmitting ? 'Memproses...' : 'Konfirmasi & Bayar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpeningShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 md:p-6 bg-blue-600 text-white">
              <h2 className="text-base md:text-lg font-bold">Buka Shift Kasir Baru</h2>
              <p className="text-xs text-blue-100 mt-1">Masukkan modal awal uang fisik di laci.</p>
            </div>
            <form onSubmit={handleOpenShiftSubmit} className="p-4 md:p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Modal Awal Laci (Rp)</label>
                <input 
                  type="number" 
                  required 
                  min={0} 
                  value={openingBalanceInput} 
                  onChange={(e) => setOpeningBalanceInput(e.target.value === '' ? '' : Number(e.target.value))} 
                  placeholder="200000" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none text-gray-800 text-sm md:text-base font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-sm text-xs md:text-sm">
                Mulai Shift Sekarang
              </button>
            </form>
          </div>
        </div>
      )}

      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 md:p-5 border-b border-gray-100"><h2 className="text-base md:text-lg font-bold text-gray-800">Catat Pengeluaran Kas</h2></div>
            <form onSubmit={handleAddExpense} className="p-4 md:p-5 space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Keterangan</label>
                <input type="text" required value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} placeholder="Beli Es Batu..." className="w-full px-3 md:px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-xs md:text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Nominal (Rp)</label>
                <input type="number" required min={1} value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="15000" className="w-full px-3 md:px-4 py-2 border border-gray-200 rounded-lg text-gray-800 text-xs md:text-sm font-semibold focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none" />
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 text-xs md:text-sm">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold shadow-sm text-xs md:text-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isClosingShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 md:p-6 bg-red-600 text-white">
              <h2 className="text-base md:text-lg font-bold">Tutup Shift Kasir</h2>
              <p className="text-xs text-red-100 mt-1">Masukkan total uang fisik di laci saat ini.</p>
            </div>
            <div className="p-4 md:p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Total Uang Fisik di Laci (Rp)</label>
                <input type="number" required min={0} value={closingCashInput} onChange={(e) => setClosingCashInput(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Hitung uang fisik..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-800 text-sm md:text-base font-semibold focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
              </div>
              <div className="flex space-x-3 pt-2">
                <button onClick={() => setIsClosingShiftModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 text-xs md:text-sm">Batal</button>
                <button onClick={handleCloseShiftSubmit} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm text-xs md:text-sm">Tutup Shift</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {closingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden print:shadow-none print:w-full">
            <div className="p-4 md:p-6 font-mono text-xs text-gray-800 space-y-3 bg-white print:p-4 max-h-[80vh] overflow-y-auto" id="printable-closing">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
                <h3 className="text-base font-bold uppercase tracking-wider">LAPORAN TUTUP SHIFT</h3>
                <p className="text-gray-500 text-[10px]">{storeInfo.name}</p>
                {storeInfo.address && <p className="text-gray-500 text-[9px]">{storeInfo.address}</p>}
                <p className="text-[10px] text-gray-500">Waktu Tutup: {closingReport.closedAt}</p>
                <p className="text-[10px] text-gray-500">Kasir: {userName}</p>
              </div>
              <div className="space-y-1.5 pb-3 border-b border-dashed border-gray-300 text-xs">
                <div className="flex justify-between"><span>Modal Awal:</span><span>Rp {closingReport.opening.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Penjualan Tunai:</span><span>Rp {closingReport.cashSales.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Penjualan Non-Tunai:</span><span>Rp {closingReport.qrisSales.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-red-600"><span>Pengeluaran Kas:</span><span>- Rp {closingReport.expenses.toLocaleString('id-ID')}</span></div>
              </div>

              {closingReport.itemsSold && closingReport.itemsSold.length > 0 && (
                <div className="space-y-1 pb-3 border-b border-dashed border-gray-300 text-xs">
                  <p className="font-bold text-gray-800 mb-1">Rincian Menu Terjual ({closingReport.totalTransactions} Transaksi):</p>
                  {closingReport.itemsSold.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-gray-600">
                      <span>• {item.name}</span>
                      <span className="font-bold">{item.qty}x</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 pb-3 border-b border-dashed border-gray-300 font-bold">
                <div className="flex justify-between"><span>Seharusnya di Laci:</span><span>Rp {closingReport.expected.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Faktual di Laci:</span><span>Rp {closingReport.actual.toLocaleString('id-ID')}</span></div>
                <div className={`flex justify-between ${closingReport.diff < 0 ? 'text-red-600' : 'text-green-600'}`}><span>Selisih:</span><span>Rp {closingReport.diff.toLocaleString('id-ID')}</span></div>
              </div>
              
              <div className="text-center pt-3 mt-2 border-t border-dashed border-gray-300">
                <p className="text-[10px] font-black text-gray-800">Powered by bit.ly/JuraganKasir</p>
              </div>
            </div>
            <div className="p-3 md:p-4 bg-gray-50 border-t flex space-x-3 print:hidden">
              <button onClick={() => { setClosingReport(null); router.push('/login'); }} className="flex-1 px-4 py-2 border rounded-lg text-gray-700 text-xs font-medium">Selesai & Logout</button>
              <button onClick={handlePrint} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold">Cetak Laporan</button>
            </div>
          </div>
        </div>
      )}

      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:w-full print:max-h-none">
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 font-mono text-xs text-gray-800 space-y-3 bg-white print:p-4 print:overflow-visible" id="printable-receipt">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
                <h3 className="text-base font-bold uppercase tracking-wider">{storeInfo.name}</h3>
                {storeInfo.address && <p className="text-gray-500 text-[9px]">{storeInfo.address}</p>}
                {storeInfo.phone && <p className="text-gray-500 text-[9px]">Telp/WA: {storeInfo.phone}</p>}
                <p className="text-[10px] text-gray-500 mt-1">{new Date(selectedReceipt.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                <p className="text-[10px] text-gray-500">Kasir: {selectedReceipt.cashier_name}</p>
              </div>
              <div className="space-y-2 pb-3 border-b border-dashed border-gray-300">
                <div className="flex justify-between text-gray-500 text-[10px]"><span>No. Transaksi</span><span>#{selectedReceipt.id.slice(0, 8)}</span></div>
                {selectedReceipt.transaction_items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between pt-1">
                    <div>
                      <p className="font-semibold">{item.product_name}</p>
                      <p className="text-[10px] text-gray-500">{item.quantity}x @ Rp {item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <p className="font-semibold self-center">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 pb-3 border-b border-dashed border-gray-300">
                {(() => {
                  const finalTotal = selectedReceipt.total_amount
                  const disc = selectedReceipt.discount_amount || 0
                  const originalSubtotal = finalTotal + disc
                  return (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>Rp {originalSubtotal.toLocaleString('id-ID')}</span>
                      </div>
                      {disc > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Diskon:</span>
                          <span>- Rp {disc.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-sm pt-1">
                        <span>TOTAL:</span>
                        <span>Rp {finalTotal.toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  )
                })()}
                
                <div className="flex justify-between uppercase pt-1"><span>Metode: {selectedReceipt.payment_method}</span><span>{selectedReceipt.payment_method === 'cash' ? 'Tunai' : 'Non-Tunai'}</span></div>
                {selectedReceipt.payment_method === 'cash' && (
                  <>
                    <div className="flex justify-between text-gray-500"><span>Bayar:</span><span>Rp {selectedReceipt.cash_received.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Kembalian:</span><span>Rp {selectedReceipt.change_amount.toLocaleString('id-ID')}</span></div>
                  </>
                )}
                {selectedReceipt.note && <p className="text-[10px] text-gray-600 italic pt-1">Catatan: {selectedReceipt.note}</p>}
              </div>
              
              <div className="text-center pt-3 mt-3 border-t border-dashed border-gray-300">
                {storeInfo.receipt_footer && (
                  <p className="font-medium whitespace-pre-line text-[10px] mb-2">{storeInfo.receipt_footer}</p>
                )}
                <p className="text-[10px] font-black text-gray-800">Powered by bit.ly/JuraganKasir</p>
              </div>
            </div>

            <div className="p-3 md:p-4 bg-gray-50 border-t flex space-x-3 print:hidden flex-shrink-0">
              <button onClick={() => setSelectedReceipt(null)} className="flex-1 px-4 py-2 border rounded-lg text-gray-700 text-xs font-bold hover:bg-gray-100">Tutup</button>
              <button onClick={handlePrint} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">Cetak Struk Sekarang</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-receipt, #printable-receipt *, #printable-closing, #printable-closing * { visibility: visible !important; }
          #printable-receipt, #printable-closing { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 80mm !important; 
            height: auto !important;
            max-height: none !important;
            margin: 0 !important; 
            padding: 5px !important; 
            background: white !important; 
            overflow: visible !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
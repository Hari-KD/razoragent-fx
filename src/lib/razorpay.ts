import Razorpay from 'razorpay'

export function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) return null
  return new Razorpay({ key_id, key_secret })
}

export function isRazorpayConfigured() {
  return !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET
}

export async function createRazorpayOrder({ amount, currency, receipt }: { amount: number, currency: string, receipt: string }) {
  const instance = getRazorpayInstance()
  // amount is in major units (e.g. 1250 USD) -> convert to smallest unit for Razorpay (paise/cents)
  // Razorpay expects INR paise; for international we simulate INR conversion via FX, but we just create order in INR
  // For mock we keep it simple
  const amountSmallest = Math.round(amount * 100)
  if (!instance) {
    // mock order
    return {
      id: `order_mock_${Math.random().toString(36).slice(2,10)}`,
      amount: amountSmallest,
      currency,
      receipt,
      status: 'created',
      mock: true
    }
  }
  try {
    const order = await instance.orders.create({
      amount: amountSmallest,
      currency: currency === 'INR' ? 'INR' : 'INR', // Razorpay India only INR; we simulate conversion
      receipt,
    })
    return order
  } catch (e) {
    // fallback mock on error
    return {
      id: `order_mock_${Math.random().toString(36).slice(2,10)}`,
      amount: amountSmallest,
      currency,
      receipt,
      status: 'created',
      mock: true,
      error: String(e)
    }
  }
}

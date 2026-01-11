
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
// Fix: Destructure from namespace import with any cast to resolve environment export issues
const { Navigate, useNavigate } = ReactRouterDOM as any;
import { useApp } from '../App';
import { SEO } from '../components/SEO';
import { formatCurrency, createOrder, validateCoupon } from '../services/db';
import { Check, Lock, Truck, ChevronRight, Ticket, X, CreditCard } from '../components/Icons';
import { ShippingDetails, Coupon } from '../types';

export const Checkout: React.FC = () => {
  const { cart, user, clearCart, settings } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // Form State
  const [shipping, setShipping] = useState<ShippingDetails>({
    fullName: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: user?.phone || ''
  });

  if (cart.length === 0) return <Navigate to="/cart" />;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Discount Calculation
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discount = (subtotal * appliedCoupon.value) / 100;
    } else {
      discount = appliedCoupon.value;
    }
  }
  // Ensure discount doesn't exceed subtotal
  discount = Math.min(discount, subtotal);

  const discountedSubtotal = subtotal - discount;
  
  // Calculate Tax based on individual product tax rates
  const tax = cart.reduce((sum, item) => {
    const rate = item.taxRate !== undefined ? item.taxRate : 0.18;
    const itemTotal = item.price * item.quantity;
    const discountRatio = subtotal > 0 ? discountedSubtotal / subtotal : 1; 
    return sum + (itemTotal * discountRatio * rate);
  }, 0);

  const total = discountedSubtotal + tax;

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    
    const coupon = await validateCoupon(couponCode, subtotal);
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponCode('');
    } else {
      setCouponError('Invalid code or minimum order not met.');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
    
    // Auto-select first available method if none selected
    if (!selectedPaymentMethod) {
        if (settings.enableCOD) setSelectedPaymentMethod('cod');
        else if (settings.enableRazorpay) setSelectedPaymentMethod('razorpay');
        else if (settings.enablePhonePe) setSelectedPaymentMethod('phonepe');
    }
    window.scrollTo(0, 0);
  };

  // Process Order Logic
  const completeOrder = async (method: string) => {
    const newOrder = await createOrder({
        userId: user ? user.id : 'guest',
        items: cart,
        total: total,
        discount: discount,
        couponCode: appliedCoupon?.code,
        status: 'Processing',
        shippingDetails: shipping,
        paymentMethod: method === 'cod' ? 'Cash on Delivery' : method === 'razorpay' ? 'Razorpay' : 'PhonePe',
        date: new Date().toISOString()
      });
      clearCart();
      setIsProcessing(false);
      navigate('/thank-you', { state: { orderId: newOrder.id } });
  };

  const handleRazorpayPayment = () => {
      // Mock Razorpay Flow
      setIsProcessing(true);
      const options = {
          key: settings.razorpayKeyId,
          amount: Math.round(total * 100),
          currency: 'INR',
          name: 'SERVERS 2',
          description: 'Order Payment',
          handler: function (response: any) {
              completeOrder('razorpay');
          },
          prefill: {
              name: shipping.fullName,
              email: shipping.email,
              contact: shipping.phone
          }
      };
      
      // In a real implementation, we would open window.Razorpay(options)
      console.log('Initializing Razorpay with options:', options);
      
      setTimeout(() => {
          // Simulate successful payment
          completeOrder('razorpay');
      }, 2000);
  };

  const handlePhonePePayment = () => {
      // Mock PhonePe Flow
      setIsProcessing(true);
      console.log('Initializing PhonePe with Merchant ID:', settings.phonePeMerchantId);
      
      setTimeout(() => {
          // Simulate redirect and return
          completeOrder('phonepe');
      }, 2000);
  };

  const handlePlaceOrder = () => {
    if (!selectedPaymentMethod) return;

    if (selectedPaymentMethod === 'cod') {
        setIsProcessing(true);
        setTimeout(() => {
            completeOrder('cod');
        }, 1500);
    } else if (selectedPaymentMethod === 'razorpay') {
        handleRazorpayPayment();
    } else if (selectedPaymentMethod === 'phonepe') {
        handlePhonePePayment();
    }
  };

  const anyPaymentEnabled = settings.enableCOD || settings.enableRazorpay || settings.enablePhonePe;

  return (
    <>
      <SEO title="Checkout" />
      <div className="bg-slate-50 min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Steps */}
            <div className="flex-1 space-y-6">
              
              {/* Step 1: Shipping */}
              <div className={`bg-white rounded-xl shadow-sm border transition-all ${step === 1 ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-200'}`}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step > 1 ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'}`}>
                      {step > 1 ? <Check size={16} /> : '1'}
                    </span>
                    Shipping Address
                  </h2>
                  {step > 1 && <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline">Edit</button>}
                </div>
                
                {step === 1 && (
                  <form onSubmit={handleShippingSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input required type="text" className="w-full p-3 border rounded-lg" value={shipping.fullName} onChange={e => setShipping({...shipping, fullName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input required type="email" className="w-full p-3 border rounded-lg" value={shipping.email} onChange={e => setShipping({...shipping, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input required type="tel" className="w-full p-3 border rounded-lg" value={shipping.phone} onChange={e => setShipping({...shipping, phone: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Street Address</label>
                      <input required type="text" className="w-full p-3 border rounded-lg" value={shipping.address} onChange={e => setShipping({...shipping, address: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <input required type="text" className="w-full p-3 border rounded-lg" value={shipping.city} onChange={e => setShipping({...shipping, city: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State / Province</label>
                      <input required type="text" className="w-full p-3 border rounded-lg" value={shipping.state} onChange={e => setShipping({...shipping, state: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Zip Code</label>
                      <input required type="text" className="w-full p-3 border rounded-lg" value={shipping.zipCode} onChange={e => setShipping({...shipping, zipCode: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Country</label>
                      <select className="w-full p-3 border rounded-lg bg-white" value={shipping.country} onChange={e => setShipping({...shipping, country: e.target.value})}>
                        <option>India</option>
                        <option>USA</option>
                        <option>Canada</option>
                        <option>UK</option>
                        <option>Australia</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2 flex justify-end mt-4">
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2">
                        Continue to Payment <ChevronRight size={18} />
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Step 2: Payment */}
              <div className={`bg-white rounded-xl shadow-sm border transition-all ${step === 2 ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-200'}`}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      2
                    </span>
                    Payment Details
                  </h2>
                </div>
                
                {step === 2 && (
                  <div className="p-6">
                    {anyPaymentEnabled ? (
                        <div className="space-y-4">
                            {/* COD Option */}
                            {settings.enableCOD && (
                                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${selectedPaymentMethod === 'cod' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <input 
                                        type="radio" 
                                        name="paymentMethod" 
                                        className="w-5 h-5 accent-blue-600"
                                        checked={selectedPaymentMethod === 'cod'} 
                                        onChange={() => setSelectedPaymentMethod('cod')}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 font-bold text-slate-900"><Truck size={20}/> Cash on Delivery</div>
                                        <p className="text-xs text-slate-500">Pay when your order arrives.</p>
                                    </div>
                                </label>
                            )}

                            {/* Razorpay Option */}
                            {settings.enableRazorpay && (
                                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${selectedPaymentMethod === 'razorpay' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <input 
                                        type="radio" 
                                        name="paymentMethod" 
                                        className="w-5 h-5 accent-blue-600"
                                        checked={selectedPaymentMethod === 'razorpay'} 
                                        onChange={() => setSelectedPaymentMethod('razorpay')}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 font-bold text-slate-900"><CreditCard size={20} className="text-blue-600 dark:text-blue-400"/> Razorpay</div>
                                        <p className="text-xs text-slate-500">Cards, UPI, Netbanking.</p>
                                    </div>
                                </label>
                            )}

                             {/* PhonePe Option */}
                             {settings.enablePhonePe && (
                                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${selectedPaymentMethod === 'phonepe' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <input 
                                        type="radio" 
                                        name="paymentMethod" 
                                        className="w-5 h-5 accent-blue-600"
                                        checked={selectedPaymentMethod === 'phonepe'} 
                                        onChange={() => setSelectedPaymentMethod('phonepe')}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 font-bold text-slate-900"><CreditCard size={20} className="text-purple-600 dark:text-purple-400"/> PhonePe</div>
                                        <p className="text-xs text-slate-500">UPI, Wallets, Cards.</p>
                                    </div>
                                </label>
                            )}

                            <button 
                                onClick={handlePlaceOrder}
                                disabled={isProcessing || !selectedPaymentMethod}
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {isProcessing ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        {selectedPaymentMethod === 'cod' ? 'Place Order' : 'Pay Now'} {formatCurrency(total)}
                                    </>
                                )}
                            </button>
                            
                            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                                <Lock size={12} /> SSL Encrypted & Secure Payment
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="text-red-500 font-bold mb-2">No Payment Methods Available</div>
                            <p className="text-sm text-slate-600">Please contact support to complete your order.</p>
                        </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="w-full lg:w-96">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
                <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                <div className="space-y-4 mb-6 max-h-80 overflow-y-auto custom-scrollbar">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                         <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-sm font-medium text-slate-900 truncate">{item.name}</div>
                         <div className="text-xs text-slate-500">Qty: {item.quantity}</div>
                         <div className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Coupon Section */}
                <div className="mb-6 pt-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Coupon Code" 
                      className={`flex-1 p-2 border rounded-lg uppercase text-sm ${couponError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      disabled={!!appliedCoupon}
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={!!appliedCoupon || !couponCode}
                      className="bg-slate-900 text-white px-4 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                  
                  {appliedCoupon && (
                    <div className="mt-3 bg-green-50 text-green-700 text-sm p-2 rounded border border-green-200 flex justify-between items-center">
                       <span className="flex items-center gap-1 font-medium"><Ticket size={14}/> {appliedCoupon.code} Applied</span>
                       <button onClick={removeCoupon} className="text-green-800 hover:text-red-600"><X size={14}/></button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Tax (GST)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between text-xl font-bold text-slate-900">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 justify-center">
                  <Truck size={14} /> Estimated Delivery: 3-5 Business Days
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

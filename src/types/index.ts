// src/types/index.ts

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  tag: string | null;
  gradient: string;
  icon: string;
  image?: string; // optional real photo path e.g. /images/starfish-keychain.jpg
}

export interface ShippingDetails {
  fname: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed';
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  items: OrderItem[];
}

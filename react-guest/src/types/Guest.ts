export interface Guest {
  id?: number;
  badge_number: number;
  g_first_name: string;
  g_last_name: string;
  g_city?: string;
  g_state?: string;
  g_yob?: number;
  g_paid: string;
  tmp_badge?: number;
  time_in: string;
  time_out?: string;
  guest_count?: number;
  payment_type?: string;
  amount_due?: number;
  tax?: number;
  cc_address?: string;
  cc_city?: string;
  cc_state?: string;
  cc_zip?: string;
  cc_name?: string;
  cc_num?: string;
  cc_cvc?: string;
  cc_exp_mo?: string;
  cc_exp_yr?: string;
  cc_x_id?: string;
}

export interface BadgeHolder {
  badge_number: number;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface PaymentResponse {
  status: string;
  message: any;
  authCode?: string;
  id?: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: any;
}

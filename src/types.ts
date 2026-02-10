// ── Products ──

export interface PriceAttributes {
  amount_in_cents: number;
  currency: string;
  charge_type: "one_time" | "recurring";
  recurring_interval?: "month" | "week" | "year";
  recurring_interval_count?: number;
  free_trial_days?: number;
}

export interface CreateProductRequest {
  product: {
    name: string;
    description?: string;
    prices_attributes: PriceAttributes[];
  };
}

export interface UpdateProductRequest {
  product: {
    name?: string;
    description?: string;
    prices_attributes?: PriceAttributes[];
  };
}

// ── Checkouts ──

export interface CheckoutItem {
  price_id?: string;
  currency?: string;
  amount_in_cents?: number;
  quantity?: number;
  name?: string;
  image?: string;
}

export interface CreateCheckoutRequest {
  checkout: {
    items: CheckoutItem[];
    success_url?: string;
    cancel_url?: string;
    user_id?: string;
    customer_id?: string;
    metadata?: Record<string, string>;
    expires_at?: string;
    coupon_id?: string;
  };
}

export interface UpdateCheckoutRequest {
  checkout: {
    items?: CheckoutItem[];
    success_url?: string;
    cancel_url?: string;
    metadata?: Record<string, string>;
    expires_at?: string;
  };
}

// ── Customers ──

export interface CreateCustomerRequest {
  email: string;
  full_name?: string;
}

export interface UpdateCustomerRequest {
  full_name?: string;
  email?: string;
}

// ── Subscriptions ──

export interface PauseSubscriptionRequest {
  act: "pause" | "unpause";
}

// ── Coupons ──

export interface CreateCouponRequest {
  coupon: {
    name: string;
    amount_off_in_cents?: number;
    percent_off?: number;
    currency?: string;
    duration: "once" | "forever";
    max_redemptions?: number;
    redeem_by?: string;
  };
}

export interface UpdateCouponRequest {
  coupon: {
    name?: string;
    max_redemptions?: number;
    redeem_by?: string;
  };
}

// ── Payment Intents ──

export interface UpdatePaymentIntentRequest {
  invoice_url?: string;
}

// ── Users ──

export interface CreateUserRequest {
  user: {
    email: string;
    password: string;
    full_name?: string;
  };
}

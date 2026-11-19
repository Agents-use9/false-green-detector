/**
 * 訂單折扣計算器業務模型（Order Calculator）
 * 包含兩種實作：
 * 1. calculateOrderTotalBuggy: AI 常見的帶有隱蔽 Bug 之實作
 * 2. calculateOrderTotalFixed: 嚴格遵循業務規格之修復版實作
 */

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface CouponResult {
  isValid: boolean;
  discountAmount: number;
}

export interface CouponService {
  validate(code: string): CouponResult;
}

export interface OrderSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

// -----------------------------------------------------------------------------
// 【實作 A：AI 生成的缺陷版本】
// 存在 3 個常見的邏輯與邊界 Bug：
// Bug 1 (臨界值錯誤): 滿 100 元應享 10% 折扣，但寫成了 `subtotal > 100`，剛好 100 元時折扣為 0。
// Bug 2 (下限擊穿錯誤): 優惠券金額若大於訂單小計，未做下限防護，導致折抵後金額出現負數。
// Bug 3 (Mock 依賴失察): 呼叫 couponService 後，未檢查 `coupon.isValid` 即直接累加折抵額。
// -----------------------------------------------------------------------------
export function calculateOrderTotalBuggy(
  items: OrderItem[],
  couponCode?: string,
  couponService?: CouponService
): OrderSummary {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.price * item.quantity;
  }

  // Bug 1: 應為 >= 100，卻寫成 > 100；應為 >= 200，寫成 > 200
  let discount = 0;
  if (subtotal > 200) {
    discount = subtotal * 0.2;
  } else if (subtotal > 100) {
    discount = subtotal * 0.1;
  }

  // Bug 3: 未驗證 isValid
  if (couponCode && couponService) {
    const coupon = couponService.validate(couponCode);
    discount += coupon.discountAmount;
  }

  // Bug 2: 若 discount > subtotal，折後金額變成負數
  const discountedSubtotal = subtotal - discount;
  const shipping = discountedSubtotal >= 80 ? 0 : 10;
  const total = discountedSubtotal + shipping;

  return { subtotal, discount, shipping, total };
}

// -----------------------------------------------------------------------------
// 【實作 B：經過行為驗收修復的嚴謹版本】
// 嚴格落實防禦性編程、臨界值驗收與錯誤處理
// -----------------------------------------------------------------------------
export function calculateOrderTotalFixed(
  items: OrderItem[],
  couponCode?: string,
  couponService?: CouponService
): OrderSummary {
  if (!items || items.length === 0) {
    return { subtotal: 0, discount: 0, shipping: 0, total: 0 };
  }

  let subtotal = 0;
  for (const item of items) {
    if (item.quantity <= 0 || item.price < 0) {
      throw new Error(`無效的商品數量或單價: ${item.name} (單價: ${item.price}, 數量: ${item.quantity})`);
    }
    subtotal += item.price * item.quantity;
  }

  // 修復 1: 滿額門檻精確包含臨界點 (>= 100 與 >= 200)
  let discount = 0;
  if (subtotal >= 200) {
    discount = subtotal * 0.2;
  } else if (subtotal >= 100) {
    discount = subtotal * 0.1;
  }

  // 修復 3: 驗證優惠券有效性，若無效則明確拋出異常或阻斷
  if (couponCode) {
    if (!couponService) {
      throw new Error('提供優惠券代碼時必須提供 CouponService 驗證模組');
    }
    const coupon = couponService.validate(couponCode);
    if (!coupon.isValid) {
      throw new Error(`無效或已過期的優惠券: ${couponCode}`);
    }
    discount += coupon.discountAmount;
  }

  // 修復 2: 折扣總額不得超過商品小計（下限防護，不得擊穿至負數）
  discount = Math.min(discount, subtotal);

  const discountedSubtotal = subtotal - discount;
  // 滿 80 元免運費，否則運費 10 元
  const shipping = discountedSubtotal >= 80 ? 0 : 10;
  const total = discountedSubtotal + shipping;

  return { subtotal, discount, shipping, total };
}

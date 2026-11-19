"""
訂單折扣計算器業務模型（Python 版本）
包含缺陷實作 (calculate_order_total_buggy) 與修復實作 (calculate_order_total_fixed)
"""
from typing import List, Dict, Optional, Any


class OrderCalculatorError(Exception):
    """業務驗證自訂異常"""
    pass


def calculate_order_total_buggy(
    items: List[Dict[str, Any]],
    coupon_code: Optional[str] = None,
    coupon_service: Optional[Any] = None
) -> Dict[str, Any]:
    """
    AI 常見的缺陷實作：
    Bug 1 (臨界值錯誤): > 100 而非 >= 100。
    Bug 2 (缺乏下限防護): 折扣可能大於商品小計，導致金額出現負數。
    Bug 3 (未驗證 isValid): 盲目信任 Mock，未檢查優惠券有效狀態。
    """
    subtotal = sum(item["price"] * item["quantity"] for item in items)

    # Bug 1: 滿 100 元應享 10% 折扣，卻寫成 > 100
    discount = 0.0
    if subtotal > 200:
        discount = subtotal * 0.2
    elif subtotal > 100:
        discount = subtotal * 0.1

    # Bug 3: 未檢查 coupon 是否有效
    if coupon_code and coupon_service:
        coupon = coupon_service.validate(coupon_code)
        discount += coupon.get("discount_amount", 0.0)

    # Bug 2: 若 discount > subtotal，折後金額變成負數
    discounted_subtotal = subtotal - discount
    shipping = 0.0 if discounted_subtotal >= 80 else 10.0
    total = discounted_subtotal + shipping

    return {
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "shipping": round(shipping, 2),
        "total": round(total, 2)
    }


def calculate_order_total_fixed(
    items: List[Dict[str, Any]],
    coupon_code: Optional[str] = None,
    coupon_service: Optional[Any] = None
) -> Dict[str, Any]:
    """
    修復後的真實行為驗收版本：
    嚴格遵循邊界、防禦性驗證與異常阻斷。
    """
    if not items:
        return {"subtotal": 0.0, "discount": 0.0, "shipping": 0.0, "total": 0.0}

    subtotal = 0.0
    for item in items:
        price = item.get("price", 0.0)
        qty = item.get("quantity", 0)
        if qty <= 0 or price < 0:
            raise OrderCalculatorError(f"無效的商品數量或單價: {item}")
        subtotal += price * qty

    # 修復 1: 臨界值包含門檻 (>= 100 與 >= 200)
    discount = 0.0
    if subtotal >= 200:
        discount = subtotal * 0.2
    elif subtotal >= 100:
        discount = subtotal * 0.1

    # 修復 3: 驗證優惠券狀態
    if coupon_code:
        if not coupon_service:
            raise OrderCalculatorError("提供優惠券代碼時必須傳入 coupon_service")
        coupon = coupon_service.validate(coupon_code)
        if not coupon.get("is_valid", False):
            raise OrderCalculatorError(f"無效或已過期的優惠券: {coupon_code}")
        discount += coupon.get("discount_amount", 0.0)

    # 修復 2: 折扣總額不得大於商品小計（下限防護）
    discount = min(discount, subtotal)

    discounted_subtotal = subtotal - discount
    shipping = 0.0 if discounted_subtotal >= 80 else 10.0
    total = discounted_subtotal + shipping

    return {
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "shipping": round(shipping, 2),
        "total": round(total, 2)
    }

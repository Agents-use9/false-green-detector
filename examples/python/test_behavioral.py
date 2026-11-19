"""
真實行為檢驗測試（Python unittest 版本）
測試 1-3 展示在 buggy 代碼上精確抓出 3 處紅燈（作為對照或驗證）；
測試 4-9 展示在 fixed 代碼上 100% 真正通過業務規格。
"""
import unittest
from order_calculator import (
    calculate_order_total_buggy,
    calculate_order_total_fixed,
    OrderCalculatorError
)


class BehavioralVerificationTestCase(unittest.TestCase):

    # --------------------------------------------------------------------------
    # 第一部分：展示真實行為測試在 Buggy 代碼上必然抓出紅燈（證明測試具備抓蟲力）
    # --------------------------------------------------------------------------
    def test_buggy_fails_on_100_threshold(self):
        """行為檢驗：滿 100 元應享 10% 折扣，Buggy 版判定錯誤必抓出紅燈"""
        items = [{"name": "商品A", "price": 100.0, "quantity": 1}]
        res = calculate_order_total_buggy(items)
        # 規格明定 discount 應為 10.0，若為 0 則紅燈報錯
        with self.assertRaises(AssertionError):
            self.assertEqual(res["discount"], 10.0)

    def test_buggy_fails_on_discount_floor(self):
        """行為檢驗：折抵額不得超過小計，Buggy 版缺乏下限防護必抓出紅燈"""
        class BigCouponService:
            def validate(self, code):
                return {"is_valid": True, "discount_amount": 50.0}

        items = [{"name": "飾品", "price": 10.0, "quantity": 1}]
        res = calculate_order_total_buggy(items, "BIG", BigCouponService())
        # 規格明定折扣上限為 10.0，Buggy 算成 50.0 應當紅燈報錯
        with self.assertRaises(AssertionError):
            self.assertEqual(res["discount"], 10.0)

    # --------------------------------------------------------------------------
    # 第二部分：驗證修復後的實作（Fixed）完全滿足業務規格
    # --------------------------------------------------------------------------
    def test_fixed_order_100_boundary(self):
        """行為 1：滿 100 元邊界值精確享有 10% 折扣且免運費（獨立預期）"""
        items = [{"name": "商品A", "price": 100.0, "quantity": 1}]
        res = calculate_order_total_fixed(items)
        self.assertEqual(res["subtotal"], 100.0)
        self.assertEqual(res["discount"], 10.0)
        self.assertEqual(res["shipping"], 0.0)
        self.assertEqual(res["total"], 90.0)

    def test_fixed_order_200_boundary(self):
        """行為 2：滿 200 元邊界值精確享有 20% 折扣且免運費"""
        items = [{"name": "商品B", "price": 200.0, "quantity": 1}]
        res = calculate_order_total_fixed(items)
        self.assertEqual(res["subtotal"], 200.0)
        self.assertEqual(res["discount"], 40.0)
        self.assertEqual(res["shipping"], 0.0)
        self.assertEqual(res["total"], 160.0)

    def test_fixed_discount_floor_protection(self):
        """行為 3：優惠券折抵上限不得大於商品小計（下限防護）"""
        class BigCouponService:
            def validate(self, code):
                return {"is_valid": True, "discount_amount": 50.0}

        items = [{"name": "飾品", "price": 10.0, "quantity": 1}]
        res = calculate_order_total_fixed(items, "BIG", BigCouponService())
        self.assertEqual(res["discount"], 10.0)
        self.assertEqual(res["total"], 10.0)  # 0 + 10 運費

    def test_fixed_invalid_coupon_rejected(self):
        """行為 4：過期或無效優惠券必須被阻斷拋出異常"""
        class ExpiredCouponService:
            def validate(self, code):
                return {"is_valid": False, "discount_amount": 20.0}

        items = [{"name": "商品C", "price": 100.0, "quantity": 1}]
        with self.assertRaises(OrderCalculatorError):
            calculate_order_total_fixed(items, "EXPIRED", ExpiredCouponService())

    def test_fixed_negative_inputs_rejected(self):
        """行為 5：非法負數單價與數量應在入口被攔截"""
        illegal_items = [{"name": "惡意商品", "price": -10.0, "quantity": 1}]
        with self.assertRaises(OrderCalculatorError):
            calculate_order_total_fixed(illegal_items)

    def test_fixed_empty_cart(self):
        """行為 6：空購物車應返回全零摘要"""
        res = calculate_order_total_fixed([])
        self.assertEqual(res, {"subtotal": 0.0, "discount": 0.0, "shipping": 0.0, "total": 0.0})


if __name__ == "__main__":
    unittest.main()

"""
AI 生成的假綠燈測試（Python unittest 版本）
展示 100% 綠燈通過但未檢驗真實行為的三大假綠燈型態
"""
import unittest
from order_calculator import calculate_order_total_buggy


class FakeGreenTestCase(unittest.TestCase):

    def test_tautological_order_100(self):
        """假綠燈 1 (同義反覆)：直接鏡像錯誤程式碼的輸出"""
        items = [{"name": "商品A", "price": 100.0, "quantity": 1}]
        res = calculate_order_total_buggy(items)

        # AI 測試鏡像程式碼輸出，認證了 0 折扣的 Bug
        self.assertEqual(res["subtotal"], 100.0)
        self.assertEqual(res["discount"], 0.0)  # 假綠燈！本應折 10 元
        self.assertEqual(res["shipping"], 0.0)
        self.assertEqual(res["total"], 100.0)   # 假綠燈！本應為 90 元

    def test_structure_sensitive(self):
        """假綠燈 2 (結構敏感)：只驗證回傳欄位形態，無視數值真偽"""
        items = [{"name": "商品B", "price": 50.0, "quantity": 2}]
        res = calculate_order_total_buggy(items)

        self.assertIsInstance(res["subtotal"], float)
        self.assertIsInstance(res["discount"], float)
        self.assertTrue(res["total"] > 0)

    def test_over_mocked(self):
        """假綠燈 3 (過度 Mock)：罐頭 Mock 掩蓋負數金額 Bug"""
        class CannedCouponService:
            def validate(self, code):
                return {"is_valid": True, "discount_amount": 15.0}

        items = [{"name": "飾品", "price": 10.0, "quantity": 1}]
        res = calculate_order_total_buggy(items, "SAVE15", CannedCouponService())

        self.assertEqual(res["discount"], 15.0)


if __name__ == "__main__":
    unittest.main()

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotalBuggy } from '../src/order-calculator.ts';

/**
 * 【對照實驗：以真實行為測試檢驗 Buggy 實作】
 * 本測試集展示：當我們用真實行為規格（獨立預期、邊界測試、異常流）來檢測 AI 生成的代碼時，
 * 真正的測試「絕對不會輕易給出綠燈」，而是能精確亮起紅燈、揪出所有隱匿的缺陷！
 */
describe('真實行為檢驗（檢測 AI Buggy 實作）：必然抓出 3 處紅燈缺陷', () => {

  it('行為檢驗 1：滿 100 元邊界值應精確享有 10% 折扣（抓出 Bug 1：臨界點判定錯誤）', () => {
    const items = [{ name: '商品 A', price: 100, quantity: 1 }];
    const res = calculateOrderTotalBuggy(items);

    // 業務規格明定：滿 100 元折 10%，折扣額應為 10 元，總額 90 元
    // 預期失敗：Buggy 實作寫成 > 100，所以 discount 算出 0！
    assert.strictEqual(
      res.discount,
      10,
      '【紅燈抓蟲】滿 100 元應精確享有 10 元折扣，不得因臨界判斷錯誤而為 0'
    );
  });

  it('行為檢驗 2：折抵金額不得大於商品總額（抓出 Bug 2：缺乏下限保護）', () => {
    const couponService = {
      validate: () => ({ isValid: true, discountAmount: 50 })
    };
    const items = [{ name: '小飾品', price: 10, quantity: 1 }];
    const res = calculateOrderTotalBuggy(items, 'BIG50', couponService);

    // 業務規格明定：商品金額 10 元，最多折抵 10 元；折後 0 元 + 運費 10 元 = 總計 10 元
    // 預期失敗：Buggy 實作 discount 變成 50，折後金額變成 -40！
    assert.strictEqual(
      res.discount,
      10,
      '【紅燈抓蟲】折扣金額上限不得超過商品小計（應為 10 元，不可為 50 元）'
    );
  });

  it('行為檢驗 3：無效或過期優惠券應明確拋出異常（抓出 Bug 3：未檢查 isValid 狀態）', () => {
    const expiredCouponService = {
      validate: () => ({ isValid: false, discountAmount: 30 })
    };
    const items = [{ name: '商品 C', price: 100, quantity: 1 }];

    // 業務規格明定：若優惠券無效，必須拒絕套用並拋出例外
    // 預期失敗：Buggy 實作直接將 30 元加到 discount 中，完全沒檢查 isValid！
    assert.throws(() => {
      calculateOrderTotalBuggy(items, 'EXPIRED_CODE', expiredCouponService);
    }, /Invalid or expired coupon|無效或已過期/);
  });
});

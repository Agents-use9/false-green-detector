import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotalBuggy } from '../src/order-calculator.ts';

/**
 * 【AI 生成的假綠燈測試集】
 * 特點：
 * 1. 測試全部顯示綠燈通過（100% Pass）。
 * 2. 測試覆蓋率高。
 * 3. 實質上完全沒有驗證真正的業務行為，反而把程式碼裡的 Bug 給「自證」並鎖定成標準行為！
 */
describe('AI 生成的假綠燈測試集（看似 100% 綠燈，實則隱匿 3 處嚴重 Bug）', () => {

  // ---------------------------------------------------------------------------
  // 假綠燈型態 1：Tautological Test（同義反覆／鏡像自證測試）
  // 特徵：測試預期值不是來自獨立業務規格，而是直接「抄寫被測程式碼的運算結果」
  // ---------------------------------------------------------------------------
  it('測試 1 (同義反覆)：驗證 100 元訂單的計算', () => {
    const items = [{ name: '測試商品 A', price: 100, quantity: 1 }];
    const res = calculateOrderTotalBuggy(items);

    // AI 生成測試時，直接觀察被測程式碼目前回傳了什麼：
    // 因為程式碼誤寫成 `subtotal > 100`，所以 100 元算出的 discount 是 0。
    // AI 測試便直接斷言：`expect(res.discount).toBe(0)`！
    // 或是 AI 在測試中用同樣的邏輯抄了一遍：`const expected = 100 > 100 ? 10 : 0;`
    // 這造成測試永遠通過，但規格書明定「滿 100 元折 10%（應為 10 元）」的行為徹底被掩蓋！
    assert.strictEqual(res.subtotal, 100);
    assert.strictEqual(res.discount, 0); // 假綠燈！竟然斷言 100 元訂單折扣為 0
    assert.strictEqual(res.shipping, 0);
    assert.strictEqual(res.total, 100);  // 假綠燈！本應為 90 元，測試卻為 100 元蓋章背書
  });

  // ---------------------------------------------------------------------------
  // 假綠燈型態 2：Structure-Sensitive Test（結構敏感／無實質行為斷言）
  // 特徵：測試只斷言型別、形狀、屬性是否存在，完全沒有檢驗業務邏輯真偽
  // ---------------------------------------------------------------------------
  it('測試 2 (結構敏感)：驗證回傳物件的型別與屬性完整性', () => {
    const items = [{ name: '測試商品 B', price: 50, quantity: 2 }];
    const res = calculateOrderTotalBuggy(items);

    // 這種測試對型別很敏感，但毫無業務意義：只要有回傳數字就給過
    assert.strictEqual(typeof res.subtotal, 'number');
    assert.strictEqual(typeof res.discount, 'number');
    assert.strictEqual(typeof res.shipping, 'number');
    assert.strictEqual(typeof res.total, 'number');
    assert.ok(res.total > 0); // 粗糙的斷言：只要大於 0 就通過，完全不管金額對不對
  });

  // ---------------------------------------------------------------------------
  // 假綠燈型態 3：Over-Mocked / Mock Theatre Test（過度 Mock／假戲假作）
  // 特徵：將外部依賴全換成永遠回傳 Happy Path 的罐頭資料，斷言只檢查 mock 有沒有被呼叫
  // ---------------------------------------------------------------------------
  it('測試 3 (過度 Mock)：套用優惠券', () => {
    let mockCalled = false;
    // 罐頭 Mock：永遠成功，不管傳什麼代碼都回傳 valid: true
    const cannedCouponService = {
      validate: (code: string) => {
        mockCalled = true;
        return { isValid: true, discountAmount: 15 };
      }
    };

    // 此處訂單金額僅 10 元，套用 15 元優惠券
    const items = [{ name: '小飾品', price: 10, quantity: 1 }];
    const res = calculateOrderTotalBuggy(items, 'SAVE15', cannedCouponService);

    // 假戲假作：只檢查 mock 有沒有被調用一次
    assert.strictEqual(mockCalled, true);
    // 只檢查回傳值有沒有把 mock 傳出的 15 加進去
    assert.strictEqual(res.discount, 15);
    // 忽略了此時 discountedSubtotal 已經變成 10 - 15 = -5（負額 Bug）！
  });
});

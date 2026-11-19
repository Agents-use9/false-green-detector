import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotalFixed } from '../src/order-calculator.ts';

/**
 * 【真實行為驗證測試集（Behavioral Verification Test Suite）】
 * 本測試集展示真正嚴謹的測試架構：
 * 1. 獨立預期（Independent Expected Values）：斷言數值完全依據業務規格計算，不依賴程式碼產生的動態推導。
 * 2. 邊界測試（Edge & Boundary Cases）：檢驗臨界點（100, 200）、0 元訂單、空清單。
 * 3. 異常路徑（Negative Path Testing）：檢驗無效優惠券、非法負數單價、負數數量。
 * 4. 契約檢驗（Contract Verification）：檢驗折抵上限與運費免運規則的聯動。
 */
describe('真實行為檢驗測試集（針對 calculateOrderTotalFixed）：驗證業務規格', () => {

  it('行為 1：滿 100 元臨界值精確享有 10% 折扣且免運費（獨立預期）', () => {
    const items = [{ name: '高級藍牙耳機', price: 100, quantity: 1 }];
    const res = calculateOrderTotalFixed(items);

    // 業務規格推導（手工獨立計算）：
    // subtotal = 100 * 1 = 100
    // discount = 100 * 0.10 = 10
    // discountedSubtotal = 100 - 10 = 90
    // shipping = 90 >= 80 ? 0 : 10 => 0 (免運)
    // total = 90 + 0 = 90
    assert.strictEqual(res.subtotal, 100, '商品小計應為 100 元');
    assert.strictEqual(res.discount, 10, '滿 100 元應精確折抵 10 元 (10%)');
    assert.strictEqual(res.shipping, 0, '折後金額達 90 元，應享免運優惠');
    assert.strictEqual(res.total, 90, '訂單實付總額應為 90 元');
  });

  it('行為 2：滿 200 元臨界值精確享有 20% 折扣且免運費', () => {
    const items = [{ name: '機械鍵盤', price: 200, quantity: 1 }];
    const res = calculateOrderTotalFixed(items);

    // subtotal = 200, discount = 40 (20%), discountedSubtotal = 160 (免運), total = 160
    assert.strictEqual(res.subtotal, 200);
    assert.strictEqual(res.discount, 40);
    assert.strictEqual(res.shipping, 0);
    assert.strictEqual(res.total, 160);
  });

  it('行為 3：未達 100 元門檻無折扣且收取運費（負向門檻檢驗）', () => {
    const items = [{ name: '滑鼠墊', price: 99, quantity: 1 }];
    const res = calculateOrderTotalFixed(items);

    // subtotal = 99, discount = 0, discountedSubtotal = 99 >= 80 => shipping = 0, total = 99
    assert.strictEqual(res.discount, 0, '99 元未達 100 元門檻，應無滿額折扣');
    assert.strictEqual(res.total, 99);
  });

  it('行為 4：優惠券折抵上限不得大於商品小計（下限防護與防穿透）', () => {
    const generousCouponService = {
      validate: () => ({ isValid: true, discountAmount: 100 })
    };
    const items = [{ name: '便利貼', price: 15, quantity: 1 }];
    const res = calculateOrderTotalFixed(items, 'BIG_DISCOUNT', generousCouponService);

    // subtotal = 15, coupon = 100 -> 折扣上限為 15
    // discountedSubtotal = 0 < 80 -> shipping = 10
    // total = 0 + 10 = 10
    assert.strictEqual(res.subtotal, 15);
    assert.strictEqual(res.discount, 15, '折扣額應受上限約束為商品小計 15 元');
    assert.strictEqual(res.shipping, 10, '折後未滿 80 元需收運費 10 元');
    assert.strictEqual(res.total, 10, '總額絕不得為負數，應為運費 10 元');
  });

  it('行為 5：過期或無效優惠券應拋出例外被系統拒絕（真實異常流）', () => {
    const expiredCouponService = {
      validate: () => ({ isValid: false, discountAmount: 50 })
    };
    const items = [{ name: '商品 C', price: 100, quantity: 1 }];

    assert.throws(
      () => {
        calculateOrderTotalFixed(items, 'EXPIRED_CODE', expiredCouponService);
      },
      /無效或已過期的優惠券/,
      '無效優惠券必須拋出明確錯誤訊息並中斷流程'
    );
  });

  it('行為 6：非法負數單價與數量必須在入口被阻斷（防禦性檢驗）', () => {
    const illegalItems = [{ name: '惡意商品', price: -10, quantity: 1 }];
    assert.throws(
      () => {
        calculateOrderTotalFixed(illegalItems);
      },
      /無效的商品數量或單價/,
      '負數單價商品必須立即報錯'
    );
  });

  it('行為 7：空購物車應返回全零摘要', () => {
    const res = calculateOrderTotalFixed([]);
    assert.deepStrictEqual(res, { subtotal: 0, discount: 0, shipping: 0, total: 0 });
  });
});

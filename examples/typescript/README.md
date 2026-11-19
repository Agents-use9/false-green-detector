# TypeScript / Node.js 假綠燈檢測範例

本範例展示「AI 生成測試的假綠燈陷阱」與「改寫為真實行為驗證」的完整對照。
使用 Node.js 18+ / 20+ / 24+ 內建的測試運行器（`node --test`），**0 外部依賴**，無需安裝額外套件即可立即執行。

---

## 目錄結構

```text
typescript/
├── package.json
├── README.md
├── src/
│   └── order-calculator.ts     # 包含缺陷版 (Buggy) 與修復版 (Fixed) 實作
└── test/
    ├── fake-green.test.ts      # AI 生成的假綠燈測試（100% 綠燈，實則隱匿 3 處 Bug）
    ├── verify-bugs.test.ts     # 真實行為測試跑在 Buggy 代碼上（精準抓出 3 處紅燈）
    └── behavioral.test.ts      # 改造後的真實行為測試（跑在 Fixed 代碼上，真綠燈）
```

---

## 快速執行指南

### 1. 執行 AI 生成的假綠燈測試（展示「虛假安全感」）
```bash
node --test test/fake-green.test.ts
```
> **觀察結果**：3 個測試全數綠燈通過（100% PASS）。然而系統內部其實存在「滿 100 元無折扣」、「折抵金額擊穿至負數」、「無效優惠券未阻斷」三大嚴重的業務邏輯 Bug！

---

### 2. 用真實行為測試檢驗 Buggy 代碼（展示「測試抓蟲力」）
```bash
node --test test/verify-bugs.test.ts
```
> **觀察結果**：3 個測試全數亮起紅燈（FAIL），精準指涉出 3 處缺陷位置與數值差異。這證明了「真正的測試不該盲目求過，而必須能在程式碼出錯時立刻報錯」。

---

### 3. 執行修復後的真實行為測試（展示「真綠燈」）
```bash
node --test test/behavioral.test.ts
```
> **觀察結果**：7 個針對業務規格、邊界值、異常流的測試全數通過（PASS），此時的綠燈才是具備工程信賴度的真綠燈。

# 假綠燈檢測 Lint 規則清單與配置指南

> **核心思維（對照 Matt Pocock 演講理念「Max Out Your Lint Rules」）**：  
> 「AI Agent 是隨機性高的代碼生成器。與其在 Prompt 裡反覆叮嚀『不要寫假測試』，不如把 Lint 規則開到最大（Max Out），利用極為廉價的本機 CPU 靜態檢查，在編譯前直接鎖死 AI 寫出空測試與自欺欺人斷言的空間。」

---

## 支援工具與規則矩陣表

| 規則識別碼 | 適用語言 / 工具 | 解決的假綠燈反模式 | 支援與驗證狀態 |
| :--- | :--- | :--- | :---: |
| `vitest/expect-expect`<br>`jest/expect-expect` | TypeScript / JavaScript<br>(Vitest / Jest) | 強制每個 `it()` / `test()` 內必須包含至少一個 `expect()`。徹底杜絕「函式跑完沒噴錯就顯示綠燈」的空測試。 | **【已核實】**<br>官方外掛穩定規則 |
| `vitest/no-conditional-expect`<br>`jest/no-conditional-expect` | TypeScript / JavaScript<br>(Vitest / Jest) | 禁止在 `if`、`catch`、`switch` 或迴圈中放置斷言。防止條件為 `false` 時整段斷言被靜默跳過而全綠。 | **【已核實】**<br>官方外掛穩定規則 |
| `vitest/valid-expect`<br>`jest/valid-expect` | TypeScript / JavaScript<br>(Vitest / Jest) | 強制 `expect(...)` 必須接續合法的 Matcher（例如 `.toBe()`）。防止 AI 寫出 `expect(data);` 這種殘缺語法。 | **【已核實】**<br>官方外掛穩定規則 |
| `@typescript-eslint/no-floating-promises` | TypeScript<br>(TypeScript-ESLint) | 禁止拋出未被 `await` 的 Promise。非同步測試中若忘記 `await`，測試框架會在非同步邏輯跑完前判定綠燈退出。 | **【已核實】**<br>TS-ESLint 核心規範 |
| `@typescript-eslint/await-thenable` | TypeScript<br>(TypeScript-ESLint) | 確保只有真正的 Promise 才能被 `await`，防止 AI 混淆同步與非同步函式調用。 | **【已核實】**<br>TS-ESLint 核心規範 |
| `no-restricted-syntax`<br>(Custom AST) | JavaScript / TypeScript<br>(ESLint Core) | 以 AST 選擇器主動禁止 `expect(true).toBe(true)`、`expect(1).toBe(1)` 等 AI 為了衝高綠燈率常見的灌水斷言。 | **【已核實】**<br>ESLint 內建核心功能 |
| `flake8-pytest-style` (PT015) | Python<br>(Ruff / Flake8) | 禁止斷言常數或永遠為真（例如 `assert True` 或 `assert 1 == 1`）。 | **【已核實】**<br>Ruff / Flake8 內建 |
| `flake8-pytest-style` (PT018) | Python<br>(Ruff / Flake8) | 禁止複合斷言（`assert a and b`）。若 `a` 為假會導致 `b` 未被評估即短路，隱藏後續驗證細節。 | **【已核實】**<br>Ruff / Flake8 內建 |
| `flake8-pytest-style` (PT011) | Python<br>(Ruff / Flake8) | 強制 `pytest.raises()` 必須指定 `match` 參數正則。防止程式碼只要噴出任何異常（如 `AttributeError`）就被誤判為通過預期異常！ | **【已核實】**<br>Ruff / Flake8 內建 |
| `mutation-testing`<br>(Stryker / Mutmut) | 多語言<br>(Stryker JS / Mutmut Py) | 突變測試：透過自動修改原始碼 AST（如變更運算子），檢驗測試套件是否會紅燈報錯（Kill Mutants）。若突變後測試仍全綠，證明該測試為假綠燈。 | **【社群工具 / 建議導入】**<br>CI 階段推薦，需額外安裝工具 |

---

## 快速配置範例

### 1. ESLint（適用於 Vitest / Jest + TypeScript）
將 `lint-rules/eslint.config.js` 的設定合併至您的專案 ESLint 配置中即可。

### 2. Python（適用於 Ruff）
在 `pyproject.toml` 或 `ruff.toml` 中加入：
```toml
[lint]
select = ["PT", "B"]

[lint.flake8-pytest-style]
fixture-parentheses = true
```

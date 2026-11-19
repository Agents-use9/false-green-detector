/**
 * 假綠燈檢測 Lint 規則配置範本（ESLint Flat Config 格式，相容 ESLint 9+ 與 8.57+）
 * 
 * 核心設計哲學（對照 Matt Pocock "Max Out Your Lint Rules"）：
 * AI Agent 的 Context 成本高且注意力有限，但靜態分析（Linter）在本地 CPU 執行成本極低。
 * 藉由極大化測試靜態檢查規則，將 AI 寫出「空測試」、「條件跳過斷言」、「未 await 的假通過」等行為
 * 在編譯與代碼檢查階段直接阻斷！
 */

import vitestPlugin from 'eslint-plugin-vitest';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    plugins: {
      vitest: vitestPlugin,
      '@typescript-eslint': tsPlugin
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    rules: {
      // -----------------------------------------------------------------------
      // 1. 強制測試必須包含實質斷言（杜絕空測與「只跑無例外即算過」的假綠燈）
      // 工具：eslint-plugin-vitest 或 eslint-plugin-jest
      // 支援狀態：【已核實】官方外掛穩定規則
      // -----------------------------------------------------------------------
      'vitest/expect-expect': [
        'error',
        {
          assertFunctionNames: ['expect', 'assert.*']
        }
      ],

      // -----------------------------------------------------------------------
      // 2. 禁止在條件式 (if / catch / switch) 中放置斷言
      // 原因：AI 經常寫出 `if (res) { expect(res.data).toBe(...) }`，當 res 為 undefined 時
      // 整段條件被跳過，測試在 0 斷言下綠燈通過！
      // 支援狀態：【已核實】官方外掛穩定規則
      // -----------------------------------------------------------------------
      'vitest/no-conditional-expect': 'error',

      // -----------------------------------------------------------------------
      // 3. 確保 expect 語法完整且具備匹配器（Matcher）
      // 防止 AI 產出殘缺語法如 `expect(fn());` 卻無 `.toBe(...)`
      // 支援狀態：【已核實】官方外掛穩定規則
      // -----------------------------------------------------------------------
      'vitest/valid-expect': 'error',

      // -----------------------------------------------------------------------
      // 4. 禁止重複測試標題（防止 AI 複製貼上產生覆蓋盲區）
      // 支援狀態：【已核實】官方外掛穩定規則
      // -----------------------------------------------------------------------
      'vitest/no-identical-title': 'error',

      // -----------------------------------------------------------------------
      // 5. 強制 await 非同步呼叫（杜絕 Floating Promise 假綠燈）
      // 原因：非同步測試若忘記 await 或 return Promise，Runner 會在非同步代碼尚未執行前
      // 判定測試結束並標記綠燈！
      // 支援狀態：【已核實】@typescript-eslint 核心規則
      // -----------------------------------------------------------------------
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // -----------------------------------------------------------------------
      // 6. AST 自訂語法限制（攔截自欺欺人型斷言）
      // 支援狀態：【已核實】ESLint 核心內建規則
      // -----------------------------------------------------------------------
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="expect"][arguments.0.value=true]',
          message: '【假綠燈警報】嚴禁使用 expect(true).toBe(true) 等自欺欺人斷言，請斷言實質業務狀態！'
        },
        {
          selector: 'CallExpression[callee.name="expect"][arguments.0.value=1]',
          message: '【假綠燈警報】嚴禁使用 expect(1).toBe(1) 假斷言！'
        }
      ]
    }
  }
];

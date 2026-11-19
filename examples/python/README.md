# Python 假綠燈檢測範例

本範例展示 Python 環境下的假綠燈對照。使用 Python 內建的 `unittest` 模組，**0 外部依賴**，任何 Python 3.8+ 環境皆可直接執行。

---

## 檔案說明

- `order_calculator.py`：包含 AI 缺陷實作（`calculate_order_total_buggy`）與修復實作（`calculate_order_total_fixed`）。
- `test_fake_green.py`：AI 生成的假綠燈測試（100% 通過，實則隱匿 3 處 Bug）。
- `test_behavioral.py`：真實行為檢驗測試（展示抓蟲紅燈能力與修復後的真綠燈）。

---

## 執行指令

### 1. 執行 AI 假綠燈測試
```bash
python3 test_fake_green.py
```
> 輸出顯示 `OK`（全數通過），展示假綠燈如何帶來虛假安全感。

### 2. 執行真實行為驗證測試
```bash
python3 test_behavioral.py
```
> 輸出顯示 `OK`，成功檢驗出邊界、下限保護、異常阻斷等關鍵業務規格。

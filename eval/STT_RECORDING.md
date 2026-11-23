# A1（#6）Whisper 測試錄音說明

目的：比較不同大小的 Whisper 模型，在**一般說話**與**戴口罩**時的字元錯誤率（CER）和延遲，決定 STT 用哪個模型。
句子都是虛構的檢傷對話，不含任何真實個資。

## 要錄什麼
- 句子在 `eval/stt_sentences.json`（P01–P18），涵蓋症狀、TOCC、醫療用語、口述數字、更正與台語腔。
- 每句錄**兩次**：`plain`（不戴口罩）和 `mask`（戴一般醫療口罩）。一個人約 36 個檔案、5 分鐘。
- 最好有 **2 位以上**組員錄，口音不同更好。P18 請用平常講話的台語腔念。

## 怎麼錄
- 手機或筆電的錄音程式都可以（m4a、wav、webm、mp3 都行），安靜的房間，距離約 30 公分。
- 用正常語速自然地念，像在檢傷站回答護理師。數字照句子念（例如「一百二十二」），不要念成阿拉伯數字。
- 檔名：`<代號>_<句子編號>_<狀況>.<副檔名>`，例如 `N01_P05_mask.m4a`。代號用 N01、N02…，**不要用本名**。

## 檔案放哪裡（不要 commit）
放在工作站的 `evidence/stt-audio/`（已被 `.gitignore` 排除）。錄音含組員的聲音，屬於個人資料，**不能 commit 或上傳到 GitHub**。

## 怎麼跑
在 repo 根目錄：

```bash
cd services/stt
uv run python ../../eval/stt_benchmark.py --models tiny base small medium
```

- 設定和 STT 服務相同（中文、beam 5、VAD、轉繁體），CPU int8。第一次會下載模型到 `evidence/whisper-models/`。
- CER 只比對文字，不計標點。結果寫到 `evidence/stt-benchmark.jsonl`，畫面會印出「模型 × 狀況」與「模型 × 類別」的平均 CER、延遲中位數和即時比（RTF，小於 1 代表比說話還快）。

## 結果怎麼記錄
把摘要表和選擇的模型寫進 `DECISIONS.md`（#6 的驗收條件），需要時把 `evidence/stt-benchmark.jsonl` 複製到 `docs/cp2/evidence/`（只有文字，不含音檔）。

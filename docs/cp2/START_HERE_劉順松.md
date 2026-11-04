# Group1 CP2 本機實作與團隊驗收

負責人：劉順松｜414551016。日期：2026-11-04。

## 現在完成到哪裡

本分支整合既有四個相依前端 PR，新增真正 API、SQLite 儲存、稽核、評估執行、CPU 語音與小型本機 LLM。未推送遠端，未代替組員核准，未上傳 E3。題目已由劉順松確認獲准。

這是供團隊確認的 CP2 技術候選版本，不等於課程所有門檻已完成。至少兩場外部使用者實測、各人兩個程式 PR、兩次有實質評論的 steward 核准、四人共同骨架與 merge day 仍須真實完成。

## 啟動

在專案根目錄開啟 PowerShell：

```powershell
./scripts/start-cp2.ps1 -Setup
```

已安裝後只需 `./scripts/start-cp2.ps1`。開啟 http://localhost:5173。此指令強制使用真正後端（VITE_API_MOCK=0）；用 Ctrl+C 停止。資料只在本機，沒有登入驗證，請勿公開網域或輸入真實病患資料。

如果 PowerShell 的組織原則阻擋腳本，不要停用原則；依 README_CP2.md 的逐一服務指令啟動。若埠被占用，先關閉之前本專案啟動的服務，不要隨意終止其他程式。

## 建議團隊驗收流程（所有內容均用虛構案例）

1. 一人開護理師頁面，選「開始新的問診」，記下 SIM 就診號。
2. 同意錄音後說「從昨天開始發燒，咳嗽，沒有旅遊史」，停止；語音停止後才送出辨識，並非邊說邊更新。
3. 語音不清時可改在逐字稿欄輸入「病患：從昨天開始咳嗽。沒有旅遊史。」；等 AI 草稿出現。
4. 點來源核對。錯的欄位手動改；每個 AI 草稿逐一確認。檢傷級數由扮演護理師的人自行選擇，不代表醫療建議。
5. 另一人用不同瀏覽器／無痕視窗開醫師頁面，確認前應看不到報告；護理師儲存後應看到同一筆資料，且不能編輯。
6. 護理師下載 JSON、複製文字；查閱 `GET /sessions/{id}/audit` 驗證修改前後值。重啟後資料應仍存在。
7. 管理者可開評估執行與匯出；匿名代碼 N-01，不輸入真實姓名。

## 驗證與證據

`./scripts/check-cp2.ps1` 跑靜態檢查、單元與整合測試。瀏覽器測試：

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD/.playwright"
pnpm --filter web exec playwright install chromium
pnpm --filter web exec playwright test
```

真實 AI 案例（需要本機模型；首次下載）：

```powershell
./services/llm/.venv/Scripts/python.exe -X utf8 eval/run_prompt_suite.py --version v3
```

`evidence/` 保存本次機器測試與截圖；`docs/cp2/` 保存說明；`submission/` 保存候選 ZIP 與雜湊。不要把模型、資料庫、.env、.git 或環境目錄交到 E3。

## 團隊接下來實際要做

- 確認使用 Qwen 小模型做本機驗證的提案；原文件的 Gemma-4 未部署，不能寫成已測通過。
- 閱讀英文報告及逐項矩陣，確認程式與 AI 已知失敗是否可接受。
- 安排兩場外部使用者操作；用 USER_TEST_PROTOCOL.md 記錄，不用 CP1 訪談冒充。
- 四人各自理解並貢獻程式、開 PR、真人 review；不能把本機整合當作所有人的課程貢獻。
- Week 11 實際進行 merge day；完成後才填入日期、參與者與結果。
- 更新人類證據後重新打包，最後由你上傳 E3。候選 ZIP 尚非可宣稱完全合規的正式繳交包。

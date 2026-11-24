# 🩺🎙️ 115A-535527 AIDLC — AI 語音檢傷問診輔助系統

## 🚀 快速開始（demo）

需求：Git、Node.js 24 與 pnpm、Python 3.12 與 [uv](https://docs.astral.sh/uv/getting-started/installation/)，以及已啟動的 [Ollama](https://ollama.com/download)。第一次安裝和下載模型需要網路，之後在本機推論，不需要雲端 API 或金鑰。

1. Clone 本 repo 並進入目錄。
2. 啟動 Ollama，執行 `ollama pull gemma3:1b`（預設模型；有 GPU 的工作站正式測試用 `gemma4:e4b`）。
3. 啟動全部服務（api、stt、llm、web）：
   - macOS／Linux：`./scripts/start.sh --setup`
   - Windows PowerShell：`./scripts/start.ps1 -Setup`

   之後啟動可省略 `--setup`／`-Setup`。終端保持開啟，Ctrl+C 會停止全部服務。
4. 開啟 http://localhost:5173 。

**主要任務（兩個人一起用，只用虛構案例）：**
1. 護理師：選「開始新的問診」，同意錄音後說一段話，例如「從昨天開始發燒，咳嗽，沒有旅遊史」，然後停止。錄音停止後才會轉成文字。語音不清楚時，可以直接在逐字稿欄輸入文字。
2. 等 AI 草稿出現，點來源核對每個欄位，錯的就改，逐欄確認。**檢傷級數由護理師自己選。**
3. 醫師：另一個人用不同的瀏覽器（或無痕視窗）開醫師畫面。護理師確認前看不到報告；確認後看得到同一份報告，而且不能編輯。

腳本啟動的 Python 服務只讀程序環境變數，**不會讀根目錄的 `.env`**（Docker Compose 和 Vite 會讀）。要換模型：先 `ollama pull`，再設定 `LLM_MODEL`（bash：`export LLM_MODEL=gemma4:e4b`；PowerShell：`$env:LLM_MODEL='gemma4:e4b'`）。Whisper small 第一次辨識語音時會下載權重。

### 其他啟動方式

- **Docker：** 先 `cp .env.example .env`（裡面的 `COMPOSE_PROFILES=dev` 決定啟動哪個前端），再 `docker compose up --build`（會自己啟動 Ollama 並下載模型）。有 NVIDIA GPU 的機器再加上 `docker-compose.gpu.yml`（見 `.env.example`）。`COMPOSE_PROFILES=demo docker compose up --build` 用建置後的前端（nginx）。
- **手動逐一啟動：** `pnpm install --frozen-lockfile`；在每個服務目錄執行 `uv sync --locked`；在 `services/api` 執行 `uv run alembic upgrade head`。再分別開終端：在 `services/api`、`services/stt`、`services/llm` 執行 `uv run uvicorn app.main:app --host 127.0.0.1 --port <埠>`（8000、8001、8002；api 要評估工具時設 `EVAL_MODE=1`）。前端：設定 `VITE_API_MOCK=0` 後執行 `pnpm --filter web dev --host 127.0.0.1`。
- **只開發前端：** `VITE_API_MOCK=1 pnpm dev`，使用記憶體中的假 API，不需要後端。

### 檢查與測試

- 全部檢查（lint、typecheck、單元與整合測試、build）：macOS／Linux `./scripts/check.sh`；Windows `./scripts/check.ps1`。結果寫在 `evidence/`（不 commit）。單元測試用明確的假模型，不下載模型。
- Prompt 測試（需要 Ollama 與模型）：`uv run --directory services/llm python -X utf8 ../../eval/run_prompt_suite.py --version v5`。說明見 [`docs/cp2/PROMPT_CARD.md`](docs/cp2/PROMPT_CARD.md)。
- 瀏覽器測試（Playwright）：`pnpm --filter web exec playwright install chromium`，再 `pnpm --filter web exec playwright test`。麥克風測試用的合成音檔在 Windows 上以 `./scripts/make-synthetic-audio.ps1` 產生。
- API 文件：http://localhost:8000/docs 。`GET /health` 只代表伺服器活著，不代表模型已載入。`GET /sessions/{id}/audit` 看欄位修改前後；`DELETE /sessions/{id}` 刪除就診、稽核與評估紀錄（不保證 SQLite 空頁、備份或匯出檔被安全抹除）。

### 範圍與已知限制

- 沒有登入：角色畫面只是展示介面，不是權限控管。只綁定本機，不要對外開放，絕對不要輸入真實病患資料。
- 小模型可能放錯欄位、處理不了更正、輸出無效 JSON。逐字引用來源檢查與護理師確認能降低風險，但不保證臨床正確。
- 不做：檢傷級數預測、醫療建議、寫入真實 HIS。

**AI 語音檢傷問診輔助系統**：在急診檢傷站聽護理師與病人的對話，轉成文字，並草擬結構化的檢傷紀錄（主訴、現在病史、TOCC、量測禁忌⋯⋯）。**護理師負責檢查、修改、確認**，而且只有護理師能決定檢傷級數。AI 不判斷檢傷級數、不給醫療建議、不直接寫入真實 HIS。

課程：CSIC30216 AI-in-the-Loop in Software Project Cycle（NYCU，2026 秋），第 1 組。全部資料都是**模擬情境**，絕對不要放真實病患資料。

## 👋 歡迎
嗨！這裡說明我們怎麼合作，以及怎麼開始。

**🔁 我們怎麼合作。** 輕量 Scrum，每個 Sprint 兩週。工作項目是 GitHub issue，Sprint 是 milestone，進度看[看板](https://github.com/users/hwupu/projects/3)（Todo → In Progress → Done，卡片用繁體中文）。AI 代理（Claude Code）擔任 Scrum Master，負責規劃、寫程式與文件，需要我們決定時會來問。你負責 review、動手修正，並對自己合併的內容負責。Product Owner 是張棨翔。

**🛡️ 三條底線。**
- 檢傷級數只有護理師能決定，AI 永遠不填。
- 沒說過的欄位就留「未提及」，不要編造。
- 只用模擬資料；AI 的重大決定與修改記在 `DECISIONS.md` 和 `prompt-log/`。

## 👥 團隊與分工
| 成員 | 學號 | GitHub | 負責領域（area lead） |
|---|---|---|---|
| 吳普軒 | 314553047 | [@hwupu](https://github.com/hwupu) | 前端、CI、`.env`、README 快速開始 |
| 張棨翔 | 414551004 | [@XiangLibra](https://github.com/XiangLibra) | LLM、後端／API、STT、docker-compose |
| 劉順松 | 414551016 | [@414551016](https://github.com/414551016) | 稽核紀錄、評估指標 |
| 林均澔 | 112550026 | [@junlinwk](https://github.com/junlinwk) | 情境與測試資料、英文文件與報告 |

其他角色：**Product Owner** = 張棨翔（排 backlog 優先順序、決定要不要驗收，也是需求與護理師／醫師意見的窗口）；**Scrum Master** = Claude Code；**Code steward** 每週輪替，見下表。

**🛡️ Code steward 輪替表**（每週一交接，週日結束）
| 週 | 日期 | Code steward |
|---|---|---|
| 8 | 10/26 – 11/1 | 吳普軒 |
| 9 | 11/2 – 11/8 | 劉順松 |
| 10 | 11/9 – 11/15 | 林均澔 |
| 11 | 11/16 – 11/22 | 張棨翔 |
| 12 | 11/23 – 11/29 | 劉順松 |
| 13 | 11/30 – 12/6 | 林均澔 |
| 14 | 12/7 – 12/13 | 吳普軒 |
| 15 | 12/14 – 12/20 | 張棨翔 |
| 16 | 12/21 – 12/27 | 吳普軒 |

- 交接時，卸任的人開 PR 更新 `DECISIONS.md` 最上面的「Current code steward」，並在 LINE 留簡短交接（未完成的 PR、風險、壞掉的東西），再用 15 分鐘帶新任走一遍檢查清單（PR template、CI 綠燈、`DECISIONS.md`、沒有真實資料或金鑰）。
- 想換週就互相同意，並在同一個 PR 更新這張表和 `DECISIONS.md`。
- Steward 不能是自己 PR 的唯一核准者；動到 CI、docker-compose、branch protection、資料庫／schema 的 PR 還要該領域的 area lead 看過。
- 第 15 週起只合併 bug 修正與 demo 必要的修改。
- 有人對 AI 輸出品質有爭議時，由當週 steward 裁決；steward 是作者本人就由其他三人多數決。

**Area lead 的責任：** 對自己領域的設計與品質負責、review 領域內的 PR、幫其他人解除阻礙。不一定要自己寫每一行。

**Ticket 怎麼分：** 每張 ticket 有一位負責人（assignee），issue 內另寫協作／Review 的人。一開始的分配只是起點；area lead 會視情況判斷工作量並**重新分配**。

**🙋 做不完或卡住，請早點說。**
- 覺得自己的 ticket 太大、做不完、卡住，或需要有人一起做，就在 issue 留言並加上 `blocked` 或 `needs-pairing`，同時在 LINE 告訴該領域的 area lead，請他們重新分配或找人協助。
- 主動求助不會被扣分；拖到最後才說才會出問題。
- 每天在 LINE 回報三行：做了什麼／接下來／卡在哪。

**🗺️ 文件在哪裡。**
| 想知道什麼 | 看這裡 |
|---|---|
| 進度與時程 | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| 系統架構（提案） | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| 前端：角色與使用者故事、流程、架構（提案） | [`docs/frontend/`](docs/frontend/) |
| Scrum 角色與流程 | [`docs/SCRUM.md`](docs/SCRUM.md) |
| 決策紀錄（含目前 code steward） | [`DECISIONS.md`](DECISIONS.md) |
| AI 使用規則 | [`AI_USAGE_GUIDELINES.md`](AI_USAGE_GUIDELINES.md)、[`CLAUDE.md`](CLAUDE.md) |
| 評估計畫、測試情境 | [`docs/EVALUATION_PLAN.md`](docs/EVALUATION_PLAN.md)、[`docs/SCENARIOS.md`](docs/SCENARIOS.md) |
| 課程繳交（CP2 報告、設計理由、評估報告、prompt 卡、team session 紀錄） | [`docs/cp2/`](docs/cp2/)，從 [`Group01_CP2_Report.md`](docs/cp2/Group01_CP2_Report.md) 開始 |
| 訪談與原始資料 | [`docs/interviews/`](docs/interviews/)、[`docs/references/`](docs/references/)（歷史資料與課程提供的原始文件，不再修改） |
| Backlog 與每個人的 ticket | [GitHub 看板](https://github.com/users/hwupu/projects/3)（唯一來源，文件裡不重複） |

**🚀 你的第一張 ticket。**
1. 完成上方的**快速開始**與**開發者一次性設定**。
2. 開[看板](https://github.com/users/hwupu/projects/3)，篩選 Assignee 是你、Sprint 是目前 Sprint 的卡片。
3. 在 repo 裡啟動 Claude Code，用下方的「簡報」與「挑下一張 ticket」提示。
4. 用「開始一張 ticket」。代理會開分支並實作。
5. 自己測試、修正，然後開 PR 並連結 issue（`Closes #編號`）。

## 📅 時程
| 週次 | 日期 | 里程碑 |
|---|---|---|
| 8 | 10/26 – 11/1 | S0：整理 repo、建立看板、確認計畫 |
| 9–10 | 11/2 – 11/15 | **S1**：端到端骨架（說話 → 逐字稿 → 草稿 → 畫面）、Whisper／Gemma 調查 |
| 11–12 | 11/16 – 11/29 | **S2**：可編輯的草稿、來源標註、稽核、評估 harness。📌 **CP2：11/23 課堂 peer review demo，11/29 E3 截止** |
| 13–14 | 11/30 – 12/13 | **S3**：安全測試、試測、正式評估。📌 **CP3 12/14 繳交** |
| 15 | 12/14 – 12/20 | 🛟 緩衝週：修 bug、分析、海報與排練（功能凍結） |
| 16 | **12/21** | 🏆 **DEMO**（90 秒 lightning talk + 40 分鐘海報／展示） |

日期與每個 Sprint 的目標以 [`docs/ROADMAP.md`](docs/ROADMAP.md) 為準；每個 Sprint 的項目在[看板](https://github.com/users/hwupu/projects/3)。

## 🛠️ 開發者一次性設定

先完成上方的快速開始，再補上協作設定：

1. **Git 身分**（程式貢獻依作者統計，email 要是 GitHub 帳號使用的）：
   ```bash
   git config user.name  "你的名字"
   git config user.email "GitHub 帳號使用的 email"
   ```
2. **Git LFS：** `brew install git-lfs`（Mac）或 `winget install GitHub.GitLFS`（Windows），然後 `git lfs install`。模型權重不 commit。
3. **環境變數：** `cp .env.example .env`，預設即可用。**不要 commit `.env`。**
4. **登入（選用）：** `gh auth login`，並啟動 `claude` 依指示登入。
5. Python 依賴以 `uv.lock` 鎖定：在服務目錄用 `uv sync --locked`；新增套件用 `uv add <套件>`，並一起 commit `uv.lock`。

## 🔄 日常流程
```bash
git switch main && git pull
git switch -c feat/<issue-number>-short-name
# 開發、測試
git add -A && git commit -m "feat: short English summary (#<issue-number>)"
git fetch && git rebase origin/main   # push 前先同步
git push -u origin HEAD               # 開 PR 並連結 issue
```
- ⬇️ **常常 pull 與 rebase**（至少每天一次、push 前一定要）。
- 🔒 **`main` 不直接 push**，一律開 PR，需要另一位成員核准（分支保護設定中）。
- 👮 **Code steward 每週輪替**，輪替表在上面的「團隊與分工」。
- ✅ **完成的定義：** PR 經他人核准、測試通過、重大決定已寫入 `DECISIONS.md`、沒有真實資料或金鑰、可以 demo。
- 📦 **大檔案**（音檔、模型、PDF／PPTX）先問代理要不要走 Git LFS，模型權重通常不要 commit。

## 📁 Repo 結構
```
apps/web/         前端（Vue 3 + Vite + TS + Tailwind；shadcn-vue 待確認）
services/api/     Session API、驗證、稽核紀錄（FastAPI + SQLite）
services/stt/     Whisper 語音轉文字（POST /transcribe）
services/llm/     欄位擷取，經由 Ollama（POST /extract；預設 gemma3:1b）
eval/             prompt 測試案例、指標、評估程式
docs/             路線圖、架構、評估、情境、Scrum、訪談；docs/cp2/ 是課程繳交文件
prompt-log/       AI 協作紀錄
CLAUDE.md         給 AI 代理的規則（AGENTS.md 是指向它的連結，給其他工具用）
```

## 💬 給 Claude Code 的提示
複製一段，把 `<...>` 換掉。

**🧭 簡報**
```text
我是 <名字>。簡報一下：這個 sprint 我有什麼工作、什麼被卡住或在等我 review、
自從 <日期> 之後有什麼變動。請簡短。
```

**🎯 挑下一張 ticket**
```text
我是 <名字>。用 `gh issue list --assignee @me` 看我未完成的 issue 與目前的 sprint，推薦我下一張該做的 ticket 並說明原因
（相依性、CP 與 demo 日期）。先不要開始做。
```

**▶️ 開始一張 ticket**
```text
我們做 #<編號>。先告訴我你的計畫與問題，然後建立分支並實作。
需要我手動設定的部分，請給我一步一步的說明。
```

**🧩 先寫介面草稿**
```text
我負責 <docs/ARCHITECTURE.md 裡我的部分>。請依照文件建立有完整公開 API 的程式骨架
（內容可以是空的），讓其他人能先接上。PR 要小。
```

**🧪 評估與安全檢查**
```text
針對 #<編號>，對照 docs/EVALUATION_PLAN.md 檢查：有沒有可能編造欄位、漏掉量測禁忌，
或輸出檢傷級數？缺少哪些測試？把缺口記在對應的 issue。
```

**🔍 Review PR**
```text
依照 issue 與 docs/ARCHITECTURE.md review PR #<編號>。指出介面不一致、缺少測試、
違反人機界線、可能含真實資料或金鑰的地方。不要直接 push 修改。
```

**🙋 我卡住了／做不完**
```text
我是 <名字>，#<編號> 我做不完或卡住了。幫我整理：做到哪、卡在哪、還需要什麼，
並草擬一則給該領域 area lead 的 LINE 訊息請他協助或重新分配。先不要改看板。
```

**🌙 收工**
```text
我今天做完了。補完 prompt log、在 issue 留進度、更新看板狀態，告訴我還剩什麼。
我說可以才 commit 和 push。
```

**🏃 Sprint 檢視**
```text
請擔任 Scrum Master。依成員整理目前 sprint（完成／進行中／有風險），
草擬檢視會議紀錄，並標出需要 Product Owner（張棨翔）決定的事項。
```

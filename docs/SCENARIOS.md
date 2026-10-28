# SCENARIOS: Simulated Triage Scenarios (模擬情境) for Testing and Demo

> **Status: DRAFT by an AI assistant. A real triage nurse must review every scenario (wording, clinical plausibility, danger-sign thresholds) before it is used as a reference.** Mark reviewed scenarios with the reviewer and date.
> All patients, ages, dates, and details are **fictional**. Never use real patient data or real 身分證字號/病歷號.
> Dialogue is in Traditional Chinese (Taiwan) because the product must work with Taiwan triage speech. Questions follow the 醫院檢傷問診病人查核表. Ages are as of Oct 2026.

---

## 1. Expected Output Schema (reference format)

Each field also carries `status` (`未提及` / `AI 草稿` / `護理師已確認`) and `source_span` in the product. A field that was **not said** must be `未提及` (null), never guessed.

```jsonc
{
  "patient": {
    "dob": "ISO date; spoken in 民國 (e.g., 民國87年5月14日 → 1998-05-14)",
    "accompanied_by": "家屬 relation | 無 | 未提及",
    "mobility": "步行 | 輪椅 | 其他 | 未提及"
  },
  "tocc": {
    "fever_cough_cold": { "value": "有 | 無 | 未提及", "details": "" },
    "travel":   { "value": "有 | 無 | 未提及", "details": "where / when (past 2 months)" },
    "occupation": "text | 未提及",
    "contact":  { "value": "有 | 無 | 未提及", "details": "" },
    "cluster":  { "value": "有 | 無 | 未提及", "details": "" }
  },
  "measurement": {
    "restrictions": [ { "site": "左手/右手/…", "reason": "洗腎瘻管/開刀/外傷/…" } ],
    "wristband_no_treatment": "bool | 未提及",
    "vitals": { "bp_sys": null, "bp_dia": null, "bp_site": "", "hr": null, "spo2": null, "temp_c": null }
  },
  "chief_complaint": "短句主訴",
  "hpi": {
    "onset": "", "location": "", "quality": "", "severity": "",
    "course": "", "aggravating_relieving": "", "associated_symptoms": [], "relevant_history": []
  },
  "flags": [ { "text": "SUGGESTION only, e.g., 發燒 38.5°C", "basis": "source_span" } ],
  "triage_level": null   // HUMAN ONLY. The AI must never fill this.
}
```

Design notes:
- Distinguish **patient-reported** values (「耳溫三十八度四」) from **nurse-measured** vitals; vitals come from the nurse's measurement.
- `flags` are suggestions for the nurse. Thresholds must be agreed with a nurse; do not invent them.

---

## 2. Scenario Overview and Splits

| ID | Title | Main thing it tests | Split | Demo |
|---|---|---|---|---|
| S01 | 流感樣症狀 (fever, cough) | happy path; TOCC cluster; reported vs. measured temp | Dev | ✅ |
| S02 | 旅遊後腹痛腹瀉 | travel history; occupation; no contact | Held-out | |
| S03 | 洗腎病人喘、腳腫 | 量測禁忌, 「禁止治療」手圈, BP on other arm | Dev | ✅ |
| S04 | 長者胸悶 + 家屬陪同 | family speaking; danger flags; wheelchair; no triage level | Dev | ✅ |
| S05 | 描述不清、資訊不足 | **no hallucination**; `未提及` handling | Dev | |
| S06 | 台語夾雜國語 | STT robustness; term normalization | Held-out | |
| S07 | 幼兒發燒、母親代答 | parent answers; 民國 DOB of child; cluster (幼兒園) | Dev | |
| S08 | 生命徵象口述與更正 | number formats; self-correction | Held-out | |
| S09 | 嘈雜環境與打斷 | noise, masks, interruptions (make variants of S01/S03) | Held-out | |
| S10 | 中途更正答案 | later statement overrides earlier one | Held-out | optional |
| S11 | 機車外傷、手腕疼痛 | 量測禁忌 caused by injury; wheelchair | Held-out | |

Rules:
- **Dev** scenarios may be used to tune prompts. **Held-out** scenarios are used only for evaluation. If you tune on a held-out scenario, move it to Dev and ask the nurse for a fresh one.
- A nurse should write or review at least 3 additional scenarios independently of the team (harder, less "clean") before final evaluation.
- Each scenario = script + reference JSON + a short list of key terms (for STT term recall) + a nurse review stamp.

---

## 3. Scenarios

Notation: 護 = nurse, 病 = patient, 家 = family. Vitals are spoken by the nurse while measuring.

### S01 流感樣症狀 (Demo, Dev)
Patient: 28-year-old elementary-school teacher, DOB 民國87年5月14日. Comes alone, walks in.

```
護：您好，請問目前有發燒、咳嗽或感冒症狀嗎？
病：有，昨天晚上開始發燒，今天早上量耳溫三十八度四，還有咳嗽，喉嚨很痛。
護：過去兩個月內，有去過國內或國外旅遊嗎？
病：沒有，我都在新竹。
護：請問您的職業是？
病：我是國小老師。
護：最近有接觸到類似症狀的人嗎？學校有很多人一起不舒服嗎？
病：有，我們班這個禮拜有四、五個小朋友請病假，聽說是流感。
護：請問您的兩隻手都可以量血壓嗎？
病：都可以。
護：好，血壓一百二十二，八十。脈搏九十二，血氧九十七，耳溫三十八點五。
護：請問這次是哪裡不舒服來掛急診呢？
病：發燒燒了一天一夜，吃退燒藥退不下來，全身痠痛，咳嗽有一點痰，晚上睡不著。
護：有喘或胸悶嗎？
病：沒有，就是喉嚨痛，吞口水會痛。
護：請問您的出生年月日是？
病：民國八十七年五月十四日。
護：今天有家屬陪同嗎？
病：沒有，我自己來。
護：您目前走路可以嗎？
病：可以。
```

Reference: fever_cough_cold 有（發燒、咳嗽、喉嚨痛）; travel 無; occupation 國小老師; contact 有（學生類似症狀）; cluster 有（班上多位學童請病假，疑似流感）; restrictions 無; vitals BP 122/80, HR 92, SpO₂ 97, temp 38.5 (**not** the self-reported 38.4); CC 發燒、咳嗽、喉嚨痛; HPI onset 昨晚（約一天）, associated 全身痠痛、咳嗽有痰、吞嚥痛、無喘/胸悶, tried 退燒藥無效; dob 1998-05-14; accompanied 無; mobility 步行; flags: 發燒 38.5°C; TOCC 群聚/接觸 positive.
Key terms: 流感, 退燒藥, 痠痛, 血氧, 耳溫.

### S02 旅遊後腹痛腹瀉 (Held-out)
Patient: 35-year-old software engineer, returned from Vietnam 5 days ago.
- 病：「從前天晚上開始肚子絞痛，一直拉肚子，一天大概六、七次，水便，沒有血。」
- 護：「過去兩個月內有去旅遊嗎？」 病：「有，上禮拜才從越南回來，在那邊吃了路邊攤。」
- 護：「同行的人有類似症狀嗎？」 病：「沒有，只有我。」
Reference: travel 有（越南，約5天前返台）; occupation 軟體工程師; contact 無; cluster 無 (or 未提及 if the nurse never asks; decide when scripting); CC 腹痛、腹瀉; HPI onset 前天晚上, quality 絞痛, 水便 6–7 次/日, no blood; flags: 近期海外旅遊史.
Tests: travel details (country + timing), negative findings ("沒有血") captured as negatives.

### S03 洗腎病人喘、腳腫 (Demo, Dev)
Patient: 68-year-old retired man, DOB 民國47年3月9日, hemodialysis, **left forearm fistula (洗腎瘻管)**. Comes with a cane.

```
護：請問目前有發燒、咳嗽或感冒症狀嗎？
病：沒有發燒，但是有一點咳嗽，躺著比較喘。
護：過去兩個月內，有去過國內或國外旅遊嗎？
病：沒有。
護：請問您的兩隻手都可以量血壓嗎？
病：左手不行，我左手有洗腎的瘻管。
護：好，我幫您的左手戴上禁止治療的手圈，血壓量右手。
護：血壓一百五十八，九十二。脈搏八十八，血氧九十三。
護：請問這次是哪裡不舒服來掛急診呢？
病：我今天喘到走不動，腳也腫起來。昨天沒有去洗腎，因為感冒不舒服。
護：我們平常是週幾洗腎？
病：一三五。
護：出生年月日是？
病：民國四十七年三月九日。
護：今天有人陪您嗎？
病：兒子在外面停車。
護：走路還可以嗎？需要輪椅嗎？
病：我拿拐杖還可以，但是今天喘，給我輪椅好了。
```

Reference: fever 無; cough 有（輕微，平躺較喘）; restrictions [{左手, 洗腎瘻管}]; wristband_no_treatment true; BP 158/92 (site 右手), HR 88, SpO₂ 93; CC 呼吸喘、下肢水腫; HPI: 今日喘到走不動, 昨日未洗腎, dialysis 週一三五, 平躺較喘; relevant_history 血液透析; mobility 輪椅; accompanied 兒子（在停車，未在場）. Flags (suggestions): SpO₂ 93%, 未洗腎, 喘.
Key terms: 瘻管, 洗腎, 禁止治療, 血氧, 輪椅.
Tests: the 量測禁忌 callout and wristband reminder; the BP must record the **right** arm; "兒子在停車" should not make `accompanied_by` a flat "有"; note the nuance in the reference and ask the nurse how to record it.

### S04 長者胸悶 + 家屬陪同 (Demo, Dev)
Patient: 76-year-old woman, DOB 民國39年8月20日, with her daughter. Wheelchair arrival.
- 護：「請問這次哪裡不舒服？」 病：「胸口悶悶的，大概兩個小時了。」 家：「她還一直冒冷汗，左邊肩膀也說痠痛。」
- 護：「有發燒或咳嗽嗎？」 家：「沒有。」
- 護：「有什麼慢性病嗎？」 家：「高血壓和糖尿病，有在吃藥。」
- 護：「兩隻手都可以量血壓嗎？」 病：「都可以。」 護：「血壓一百八十五，一百，脈搏一百零二，血氧九十六，體溫三十六點八。」
- 護：「出生年月日？」 家：「民國三十九年八月二十日。」 護：「輪椅可以嗎？」 家：「對，我們用輪椅推進來的。」
Reference: CC 胸悶; HPI onset 約2小時前, quality 悶, associated 冒冷汗、左肩痠痛; relevant_history 高血壓、糖尿病（服藥中）; BP 185/100, HR 102, SpO₂ 96, temp 36.8; fever/cough 無; accompanied 女兒; mobility 輪椅; flags (suggestions): 胸悶+冒冷汗+左肩痛, 血壓偏高, 心跳偏快; triage_level null.
Tests: speaker attribution (daughter vs. patient), danger-sign **suggestions** without any triage level, TOCC fields not asked → `未提及`.
Key terms: 胸悶, 冒冷汗, 高血壓, 糖尿病.

### S05 描述不清、資訊不足 (Dev) — negative test
Patient: elderly man, vague answers; the nurse skips TOCC occupation, family, and mobility questions.
- 護：「請問這次哪裡不舒服？」 病：「就……不太舒服啦。」 護：「是哪裡不舒服？痛嗎？」 病：「不知道，就整個人怪怪的。」 護：「什麼時候開始的？」 病：「想不起來。」
- 護：「有發燒嗎？」 病：「應該沒有吧。」 護：「最近有去旅遊嗎？」 病：（沒有回答，改談別的事）
Reference: CC 「不太舒服」（描述不明確）; onset 未提及; location 未提及; fever 無（患者稱「應該沒有」, uncertain）; travel 未提及; occupation/family/mobility/dob 未提及; no vitals; flags none.
Tests: **no fabrication**. Success = empty fields stay `未提及`, uncertainty is preserved ("應該沒有" not turned into a firm 無), HPI not padded.

### S06 台語夾雜國語 (Held-out)
Patient: 72-year-old man mixing Hokkien and Mandarin. **Script wording needs review by a native Taiwanese speaker.**
- 病：「我頭殼足痛，閣有想欲吐，昨昏開始的。」（頭痛、想吐，昨晚開始）
- 病：「肚子無啦，嘸過頭暈暈。」
Reference (normalized): CC 頭痛、噁心; onset 昨晚; associated 頭暈.
Tests: Whisper output on Hokkien-influenced speech; whether the LLM normalizes to standard clinical wording and keeps `source_span` as the original text. Report CER separately; do not penalize the LLM for STT failures (use gold-transcript comparison).

### S07 幼兒發燒、母親代答 (Dev)
Patient: 3-year-old girl, DOB 民國112年8月3日. Mother answers everything.
- 家：「她發燒兩天了，昨天晚上量到三十九度二，今天還有流鼻水，嘴巴裡好像有破洞，不太肯吃東西。」
- 護：「有上幼兒園嗎？班上有類似症狀的小朋友嗎？」 家：「有，同班有兩個確診腸病毒。」
- 護：「這兩個月有出國或旅遊嗎？」 家：「沒有。」 護：「體溫三十八點九，脈搏一百三十，血氧九十八。」
Reference: CC 發燒兩天、口腔破洞、食慾差; HPI associated 流鼻水; travel 無; cluster 有（幼兒園同班二人確診腸病毒）; occupation: N/A (child); accompanied 母親; vitals temp 38.9, HR 130, SpO₂ 98 (BP not measured → null); dob 2023-08-03.
Tests: caregiver as speaker, 民國 date conversion, `occupation` not hallucinated, BP null.

### S08 生命徵象口述與更正 (Held-out)
Patient: 45-year-old man, dizziness. Focus on the nurse's dictation.
- 護：「血壓一百三，八十五……不對，一百三十五，八十五。脈搏七十八。血氧九十七……喔，九十九。體溫三十六點五。」
- Variants: 「血壓一三五，八十五」, 「135 over 85」, 「收縮壓一百三十五、舒張壓八十五」, a value dictated before the cuff finishes.
Reference: BP 135/85, HR 78, SpO₂ 99 (final corrected value), temp 36.5.
Tests: last-value-wins, spoken number formats, no mixing of the rejected value. Safety-critical: any mismatch is a vitals error.

### S09 嘈雜環境與打斷 (Held-out) — robustness variants
Create variants of S01 and S03 rather than writing new content:
- background ER noise mixed at 2–3 signal-to-noise levels; patient wearing a mask; a staff member interrupts with an unrelated question (「護理長，三號床的家屬在找您」); the patient coughs mid-sentence; overlapping speech.
Expected: same reference as the clean version. The interruption content must **not** appear in the report.
Tests: STT degradation curve (CER vs. noise), robustness of extraction, ignoring irrelevant speech.

### S10 中途更正答案 (Held-out)
Patient: 52-year-old woman.
- 護：「最近有去旅遊嗎？」 病：「沒有。」
- (later) 病：「啊，對了，我上個月有去日本玩一個禮拜，忘記了。」
Reference: travel 有（日本，約一個月前，一週）. The later statement overrides the earlier "沒有".
Tests: update/override behavior in the draft, and that the UI shows the field changed (good moment for the demo to show nurse trust and traceability via `source_span`).

### S11 機車外傷、手腕疼痛 (Held-out)
Patient: 24-year-old delivery rider, DOB 民國91年9月1日 (age 24), fell off a scooter 30 minutes ago; right wrist swollen and deformed.
- 護：「兩隻手都可以量血壓嗎？」 病：「右手不行，我的手腕好像斷了，不能碰。」 護：「好，右手戴禁止治療手圈，血壓量左手。」 護：「血壓一百三十八，八十二，脈搏一百零五，血氧九十九。」
- 病：「機車自己滑倒，手撐地，右手腕很痛，不敢動，左膝也有擦傷。」
- 護：「走路可以嗎？」 病：「左腳會痛，走不了。」 護：「幫您換輪椅。」
Reference: restrictions [{右手, 外傷（疑似骨折）}]; wristband true; BP 138/82 (left); HR 105; SpO₂ 99; CC 機車自摔、右手腕疼痛腫脹變形、左膝擦傷; onset 約30分鐘前, mechanism 機車自摔; mobility 輪椅; TOCC mostly 未提及.
Tests: the 量測禁忌 reason is trauma (not dialysis); the AI must write "疑似" only if the patient said it, and must not add a diagnosis (e.g., "骨折"), since that is the clinician's job. Note: the reference should record what was said, not what is likely.

---

## 4. Demo Script (target 5–7 min; adjust to the course format)

| Min | What | Scenario | What it shows |
|---|---|---|---|
| 0:00 | Problem in 30 s: paper-then-HIS double entry, 2–3 min/patient (nurse's estimate) | — | evidence-based motivation |
| 0:30 | **Live**: nurse and "patient" run S01; draft fills in; nurse corrects one field; confirms | S01 | hands-free flow, `AI 草稿` → `護理師已確認`, `source_span` |
| 2:30 | S03 excerpt: 左手洗腎瘻管 → 禁止治療手圈 callout; BP on right arm | S03 | 量測禁忌 handling |
| 3:30 | S04 excerpt: daughter speaks; danger-sign **suggestions**; point out the empty `triage_level` | S04 | human–AI boundary |
| 4:30 | Physician view opens in a second browser with the confirmed 主訴/HPI | S01/S04 | handoff, less re-asking |
| 5:30 | Evaluation results slide: time, edit burden, safety counts, honest limits | — | evidence |
| 6:30 | Q&A; fallback = pre-recorded audio fixtures if live mic/network fails | — | reliability |

Demo checklist: HTTPS/mic permission tested on the demo machine; GPU/models warm; fallback audio ready; synthetic data only; a teammate plays the patient (consented).

---

## 5. Audio Fixtures (for regression and offline demo)

- Record each scenario twice: nurse + patient voices read from the script (teammates, with consent), clean and masked. Add noisy variants for S09 by mixing background noise.
- Format: 16 kHz mono WAV; filename `S01_clean.wav`, `S01_masked.wav`, `S01_noise_snr10.wav`.
- Store the gold transcript (`S01.txt`) and the reference JSON (`S01.json`) next to each file.
- Don't commit recordings of voices without the speakers' consent; consider not committing audio to a public repo at all.

---

## 6. Scenario Review Log

| ID | Nurse reviewer | Date | Changes requested | Status |
|---|---|---|---|---|
| S01–S11 | — | — | — | DRAFT (unreviewed) |

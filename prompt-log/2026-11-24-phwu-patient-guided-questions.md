# Patient screen: one fixed question at a time, read aloud
- Date: 2026-11-24
- Author: 吳普軒 (hwupu)
- Tool / model: Claude Code / Claude Opus 5.5
- PR: #109 (Closes #86)

## Prompt
Which of my tickets (#28, #86, #87) first? Then: since the questions are in a fixed order, do it in the frontend so
we can demo quickly; change the API to include a question field later if needed. Can you generate the question
voice, saved as mp3/ogg? Use the v1 questions so the demo can be confirmed.

## Output summary
- Recommended #86 → #28 → #87 (later reordered by the author to #86 → #87 → #28).
- `PatientView.vue` and `stores/patientInput.ts` rewritten: start screen, one question per screen, progress, voice or
  typed answers, 有/沒有 for yes/no questions with a fixed follow-up after 有, skip, back, re-answer; 「您的回答」
  shows only the patient's own words. Each answer is sent as `問：… 答：…`; sends run in the background and
  finishing waits for them and for recordings still being transcribed.
- `intake/questions.json` / `questions.ts` (v1 list with report-field mapping), `composables/useQuestionAudio.ts`,
  `scripts/make-question-audio.sh` (macOS `say` + ffmpeg → 15 mp3 files and a manifest), mock api returning one
  transcript per patient recording, tests rewritten (incl. a stale-audio check).
- Found and fixed in its own browser check: the question count was missing (a plain number dropped by `storeToRefs`).

## Outcome
- Kept: all of the above; the author tested it by hand.
- Changed: mp3 only (ogg does not play on older iPad Safari); files tracked with Git LFS at the author's choice.
- Rejected: changing the input API now; changing the prompt (the new transcript format still needs a real-model
  check). Reading questions aloud was out of scope by the PO's 2026-11-22 decision, so it is recorded as a proposal
  in `DECISIONS.md` for the PO to confirm.

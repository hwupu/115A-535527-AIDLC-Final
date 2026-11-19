# Metric definitions

All 12 prompt cases are synthetic development data, not nurse-reviewed clinical references. Each lists its expected fields in eval/cases.json. Do not report development performance as held-out accuracy.

- Exact match: compare normalized values for the union of reference and nonempty predicted keys. Missing/extra/wrong values fail. NFKC and whitespace normalization only; punctuation and clinically meaningful wording are not removed. Lists are sorted; booleans do not equal numbers. Report numerator and denominator. No comparable fields gives null, not 100%.
- Case pass: all compared fields match and there are no missing/extra values. Empty expected/empty output counts as an abstention pass, separately identified. API/JSON failure counts as case fail, never excluded from case denominator.
- Unsupported-field count: predicted nonempty path absent or empty in reference. This measures reference disagreement, not a clinically adjudicated hallucination rate. Source containment alone is insufficient proof of semantic support.
- Omission count: expected nonempty path absent in prediction. Incorrect present values are mismatches, reported separately through exact match.
- CER: character Levenshtein distance / reference character length after NFKC and whitespace normalization; punctuation retained. Empty reference with nonempty prediction gives null; empty/empty gives zero. Scores can exceed 1 with insertions.
- Human task-time reduction: (baseline seconds - tool seconds) / baseline seconds. Baseline zero is invalid. Measure both with the same complete-handoff stopping rule; report failures/manual fallback time, order and raw observations.
- Edit burden: audit field_edit counts within task_start/task_end, report edits and unchanged confirmations separately. Time-to-confirm and p50/p95 inference latency are distinct; do not conflate warm latency, downloads and human task times.
- HPI rubric: NOT FINALIZED. Ask a nurse to define essential onset/location/quality/associated features per scenario and review the rubric before claiming HPI recall. No human-scored HPI result is available.
- Clinical safety metrics and targets (zero fabricated vitals, no boundary violation) require separately reviewed cases. Unit tests demonstrate guards on selected inputs, not clinical safety or full absence of errors.

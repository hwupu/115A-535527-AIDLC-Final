# Draft Evaluation Plan

> **Prototype scope and safety boundary:** This course prototype is a
> physician-in-the-loop drafting assistant, not an autonomous clinical system.
> It may use only synthetic cases or properly de-identified records that the
> team is explicitly authorized to use. No identifiable patient record is sent
> to a public AI service. Local deployment does not replace the need for
> institutional approval, access control, and an appropriate privacy review.

## Problem Grounding

### 1. Who specifically experiences the collaboration problem?

Residents and attending physicians preparing discharge summaries for inpatients
work under time pressure. They must turn a long, chronological medical record
into a concise handoff document while ensuring that diagnoses, medication
changes, allergies, follow-up actions, and pending tests are accurate. The
summary is then used by the next care team and the patient.

### 2. What do they currently do instead of our tool?

Clinicians manually read notes, orders, laboratory results, and medication lists
in the electronic health record, then copy, paste, and rewrite the important
facts into a discharge-summary template. They may ask a colleague to check a
summary when time permits. This process is slow, repetitive, and makes it easy
to omit an important detail or carry forward an outdated one.

### 3. What observable differences would indicate success?

With the tool, a clinician receives a draft organized by the required discharge
sections. Each important statement has a link to the supporting record excerpt,
and unsupported or missing fields are visibly flagged. The clinician can accept,
edit, or reject every section before signing. We expect shorter review time,
fewer missing required fields, and fewer manual searches through the record;
we do **not** expect the clinician to delegate clinical judgment to the AI.

## System and Human--AI Boundary

The prototype runs an open-weight model locally through **Ollama**. Ollama
generates a *draft only* from the approved, de-identified input and returns
structured sections with source-record identifiers. If retrieval-augmented
generation (RAG) is used, the model may use only the retrieved excerpts supplied
by the system.

The AI may:

- draft plain-language summaries of supplied facts;
- group facts into discharge-summary sections;
- identify missing required fields and mark uncertainty; and
- show the source excerpt and retrieval identifier used for a statement.

The AI may not make a diagnosis, prescribe or change medication, determine that
a patient is ready for discharge, write directly to the production record, or
sign a summary. A physician decides whether every statement is correct, edits or
rejects it, resolves disagreements in the source record, and is the only person
who can approve a final summary.

## Success Definition

We will know the prototype is useful if physicians can review a source-linked
AI draft faster than creating the same summary manually **without reducing
accuracy or completeness**. For this course evaluation, we will measure:

- median time from opening a case to a clinician-approved draft;
- required-field completeness for admission reason, discharge diagnoses,
  hospital course, procedures/results, discharge medications, allergies,
  follow-up plan, and pending tests;
- factual-support rate: the percentage of important statements supported by the
  cited source excerpt;
- hallucination rate: the percentage of important statements with no supporting
  source, or that contradict the source;
- omission rate for required fields and clinically important facts;
- physician actions per draft: accept, edit, reject, and escalate for further
  review; and
- a short 1--5 physician rating of whether the draft reduced documentation
  workload without making review harder.

The AI improves the *drafting and evidence-finding* step. Humans retain all
clinical and sign-off decisions.

## Target Users

The intended users are residents and attending physicians who write or review
inpatient discharge summaries. For the course prototype, we will recruit 3--5
clinically trained volunteers (for example, residents, attending physicians, or
senior medical students) through our team members and course network. If
clinicians are unavailable, we will clearly label the usability study as a
simulation with senior medical students rather than claiming clinical validity.

## Method

### Phase 1 — Offline quality and safety review

Use 10--20 synthetic or authorized de-identified cases. For each case, two
clinically trained reviewers independently compare the AI draft with the source
record and label every important statement as:

1. supported and correct;
2. supported but incomplete or unclear;
3. unsupported / hallucinated;
4. contradicted by the source; or
5. omitted when required.

Reviewers also label an error as **major** when it could plausibly affect patient
safety, such as an incorrect discharge medication, dose, allergy, diagnosis, or
follow-up instruction. A third reviewer adjudicates disagreements.

### Phase 2 — Human-in-the-loop usability study

During a later lab or pilot session, participants prepare comparable simulated
cases using their usual manual workflow and using the source-linked AI draft.
We record completion time, missing fields, edits, accept/reject actions, and a
brief workload rating. The final output is treated as a simulation; no AI draft
may be used as a real patient record.

## Minimum Evidence Threshold

The prototype will be considered promising for further research, not ready for
clinical deployment, only if all of the following are true:

- all high-risk fields are explicitly reviewed by a human before sign-off;
- no major error remains in the clinician-approved simulated summary;
- at least 90% of required fields are complete after review;
- at least 95% of important AI statements are supported by their displayed
  source excerpt after reviewer adjudication;
- the median review time is lower than the manual baseline, or a majority of
  participants report a meaningful reduction in documentation workload without
  reporting lower confidence; and
- reviewers can explain why each rejected or edited statement was changed.

Any uncorrected major error, missing source evidence for a high-risk statement,
or privacy/security incident pauses testing until the team documents the issue,
fixes it, and re-evaluates the affected cases.

## Generation, Quality, and Safety Monitoring

Each generation must create an auditable log entry. The log contains no direct
identifiers and uses a case ID rather than patient information.

| Monitoring area | What we record | Why it matters |
|---|---|---|
| Input and environment | case ID, de-identification status, Ollama model tag/version, prompt-template version, parameters, context size, timestamp, and latency | Makes results reproducible and identifies changes in model behavior. |
| Output quality | required-field completeness, factual-support rate, omission rate, and reviewer agreement | Measures whether the draft is useful and clinically checkable. |
| Hallucination and risk | unsupported/contradicted statements, major-error count, high-risk field errors, and blocked outputs | Detects unsafe content rather than hiding it behind fluent text. |
| Human correction | accept/edit/reject/escalate action, edit category, time to review, and workload rating | Shows whether AI actually reduces work and where human review is still needed. |
| Retrieval / RAG, if enabled | retrieved source IDs, citation precision, citation coverage, retrieval failures, and whether the cited excerpt supports the claim | Separates a retrieval failure from a generation failure. |
| Governance | authorized user ID or role, access event, version history, incident ID, and corrective action | Provides accountability without recording unnecessary patient information. |

We will review aggregate monitoring results after each evaluation batch. A rise
in hallucinations, major errors, rejected drafts, or review time triggers a
prompt/model/retrieval review and a documented decision before further testing.

## Reporting

For every test batch, we will report the model and prompt versions, number and
type of cases, reviewer roles, all metrics above, known limitations, and the
number of drafts requiring major correction. We will not describe the prototype
as clinically safe or deployable based on a small course evaluation.

"""Generate the review PDF from observed machine evidence, never invented user results."""
import json
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'evidence' if (ROOT / 'evidence' / 'prompt-v3.jsonl').exists() else ROOT / 'docs/cp2/evidence'
pdfmetrics.registerFont(TTFont('CJK', 'C:/Windows/Fonts/msjh.ttc', subfontIndex=0))
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='NameCJK', fontName='CJK', fontSize=12, leading=18))
styles['Title'].textColor = colors.HexColor('#123c6a')
styles['Heading1'].textColor = colors.HexColor('#123c6a')
styles['BodyText'].fontSize = 10
styles['BodyText'].leading = 15
story = []


def p(text, style='BodyText'):
    story.append(Paragraph(escape(text), styles[style]))
    story.append(Spacer(1, 3 * mm))


def table(rows, widths):
    cells = [[Paragraph(escape(str(x)), styles['BodyText']) for x in row] for row in rows]
    t = Table(cells, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eaf1f8')),
        ('GRID', (0, 0), (-1, -1), .4, colors.HexColor('#c7d1dd')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(t)
    story.append(Spacer(1, 5 * mm))


def page(title):
    if story:
        story.append(PageBreak())
    p(title, 'Heading1')


def cases(version):
    return [json.loads(line) for line in (EVIDENCE / f'prompt-{version}.jsonl').read_text(encoding='utf-8').splitlines()]


v2, v3 = cases('v2'), cases('v3')
page('Group1 - Checkpoint 2')
p('AI Voice Triage Handoff Assistant', 'Title')
p('LOCAL REVIEW CANDIDATE - HUMAN EVIDENCE PENDING', 'Heading2')
p('Prepared: 2026-11-04 | Course: CSIC30216 | Student ID: 414551016')
p('劉順松 / Group1', 'NameCJK')
p('The user confirmed instructor approval of the topic. This package contains a locally runnable technical candidate, reproducible machine tests, prompt revision evidence and a plan for required human evaluation. It has not been submitted to E3 or approved/merged by the team.')
p('Problem and intended outcome', 'Heading2')
p('Triage nurses describe writing notes and re-entering them later; physicians receive incomplete handoffs and re-ask questions. The tool transcribes a simulated conversation, proposes source-linked fields, asks the nurse to review, and lets the physician read the confirmed record in a separate browser.')
p('Evidence boundary', 'Heading2')
p('The two CP1 interviews establish discovery context. They are not prototype usability sessions. No external-user CP2 session was conducted during this run. The reported extra 2-3 minutes per patient is an interview estimate, not a measured baseline. No time-saving or clinical-safety claim is made.')
p('Repository: https://github.com/hwupu/115A-535527-AIDLC-Final')
p('Official CP2: https://csic30216-fall26.denniswang.net/project/cp2/')

page('1. What the candidate implements')
table([
 ['Component', 'Implemented behavior'],
 ['Vue interface', 'Upstream patient, nurse, doctor and admin workflow integrated locally from the existing PR stack; upstream authorship is preserved.'],
 ['Session API', 'Real shared session lifecycle, SIM visit numbers, source fields, per-field edits and confirmation, ETag list polling and read-only confirmed reports.'],
 ['Persistence / audit', 'SQLAlchemy SQLite records and initial Alembic migration. Before/after field values and confirmation events persist; active-session deletion removes linked active records.'],
 ['Speech', 'Real MediaRecorder whole clips, CPU int8 Whisper small and OpenCC s2twp. Audio is decoded in memory; no default audio persistence.'],
 ['AI', 'Local Qwen/Qwen2.5-0.5B-Instruct CPU adapter. v3 selects literal quotes for six fields; deterministic grounding and API validation follow.'],
 ['Evaluation / export', 'Anonymous run codes, task timing/events, JSON/CSV and confirmed-report JSON/text export.'],
], [42*mm, 128*mm])
p('The nurse owns the triage decision. AI never writes that field. The physician report endpoint returns 409 until confirmation. No clinical alerts, diagnosis, treatment or HIS integration are claimed. Fields outside the small v3 extraction scope remain manually editable.')
p('Local access is not authentication. Roles are demo routes and anyone with API access can impersonate them. Bind to localhost and use fictional data only. The original Gemma-4 runtime is not deployed or benchmarked; Qwen is a local validation proposal requiring team ratification.')

page('2. Verification and scope of evidence')
checks = json.loads((EVIDENCE / 'checks.json').read_text(encoding='utf-8-sig')) if (EVIDENCE / 'checks.json').exists() else []
table([['Check', 'Observed evidence'],
 ['Frontend', '34 tests, plus lint, typecheck and production build; logs in evidence/.'],
 ['Backend / model guards', 'API workflow, persistence, audit, confirmation, invalid input, ETag, evaluation lifecycle and deletion. Model transport is mocked in unit tests; real inference is separate.'],
 ['Browser', 'Two independent nurse/doctor contexts, two tablet dimensions, actual-model typed-input path and synthetic-microphone MediaRecorder/Whisper path. See browser-tests.json.'],
 ['Prompt', f'12 synthetic development cases; v2 {sum(c["metrics"]["case_pass"] for c in v2)}/12, v3 {sum(c["metrics"]["case_pass"] for c in v3)}/12 whole cases passing.'],
 ['Speech', 'One local Hanhan synthetic TTS clip. tiny/base misrecognize travel history; small recovers the intended content with punctuation differences.'],
 ['External users', 'NOT CONDUCTED. No measured human task-time or handoff-question outcome.'],
 ['Docker', 'Configuration checked separately; daemon/build not verified in this run. Windows direct launch is the tested path.'],
], [42*mm, 128*mm])
p(f'Final command checks recorded: {len(checks)}; nonzero exits: {sum(c["exit"] != 0 for c in checks)}. Consult logs for exact counts and warnings; passing these checks does not replace human evaluation.')
p('The browser actions are automation of simulated roles, not real two-person user research. TTS is not a consenting real speaker. The small development suite is neither held out nor nurse-reviewed.')

page('3. Prompt revision and honest results')
p('Observed failure: v2 asked for nested objects containing value and source_span. On T01, the model returned flat values; validation rejected them and none of the three reference fields matched.')
p('Change: v3 explicitly asks the model to copy raw phrases. A deterministic adapter checks exact quote containment and normalizes selected field types. T01 then matched cough, yesterday and negative travel history (3/3). Both versions and raw outputs are preserved; no failures were deleted.')
rows = [['Case', 'Type', 'v3 outcome']]
for c in v3:
    rows.append([c['id'], c['kind'], 'PASS' if c['metrics']['case_pass'] else 'FAIL - ' + ('invalid output' if 'error' in c else 'reference mismatch / misclassification')])
table(rows, [22*mm, 42*mm, 106*mm])
p('8/12 whole-case passes include empty/safety abstentions; this is not 90% field accuracy. T02/T12 classify travel as chief complaint, T03 differs from the strict expected wording, and T06 fails correction parsing. Source containment is necessary but not proof that a quote supports its assigned field. Human review remains essential.')

page('4. External-user evaluation plan')
p('Required before CP2: conduct at least two prototype testing sessions with real users outside the team. Record anonymous role, actual date, consent, software version, task, observations and design changes. The blank protocol is in docs/cp2/USER_TEST_PROTOCOL.md.')
p('Use fictional matched cases: baseline paper note plus simulated record entry versus this tool, with the same complete-handoff stopping point. Counterbalance method order across participants. Include manual fallback and failures in time measurements rather than excluding them.')
table([['Measure', 'How it will be reported'],
 ['Time saving', 'Raw baseline and tool seconds per participant; median/range; (baseline-tool)/baseline. NOT MEASURED yet.'],
 ['Handoff quality', 'Missing/wrong fields and repeated clarification questions; actual examples and their consequences. NOT MEASURED yet.'],
 ['Interaction design', 'Observed confusion, assistance needed, changed design and retest. No invented quotes.'],
 ['HPI scoring', 'Nurse-reviewed key-element rubric per scenario. NOT FINALIZED.'],
], [42*mm, 128*mm])
p('Complete these results before replacing the current missing-evidence statement. CP1 interviews and screenshots cannot substitute for these sessions. The original 30% time reduction and 90% field targets remain proposed goals.')

page('5. Team review and submission checklist')
table([['Item', 'Next human action'],
 ['Model / design', 'Ratify or replace CPU Qwen adapter and restricted-field scope. Review actual failures and safety limits.'],
 ['Individual contributions', 'Each of four students needs two substantive merged code PRs by CP2. This local uncommitted work is not proof for all members.'],
 ['Steward reviews', 'Each student needs two approvals with substantive comments and at least one recorded steward term. AI does not approve PRs.'],
 ['Walking skeleton', 'Four actual participants, code touched by each, merged PR link. This run did not conduct the mandatory joint session.'],
 ['Merge day', 'Actual Week 11 meeting, dependency/conflict plan, stable main and DECISIONS entry. Do not prefill attendance/results.'],
 ['External testing', 'At least two actual sessions and findings integrated into design rationale/evaluation.'],
 ['E3', 'One Group1_CP2 ZIP with repository-link text, after team confirmation and outstanding evidence completion. User uploads; no upload performed here.'],
], [42*mm, 128*mm])
p('Run scripts/start-cp2.ps1 -Setup to launch; scripts/check-cp2.ps1 for checks. Read README_CP2.md and the Traditional-Chinese START_HERE guide. The review ZIP excludes .env, .git, model weights, local database, virtual environments and installed tools. Review source, machine evidence and hashes before upload.')
p('Status: TECHNICAL CANDIDATE COMPLETE FOR REVIEW; FULL CP2 HUMAN EVIDENCE STILL OUTSTANDING.', 'Heading2')


def footer(canvas, doc):
    canvas.setStrokeColor(colors.HexColor('#c7d1dd'))
    canvas.line(20*mm, 16*mm, 190*mm, 16*mm)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#526477'))
    canvas.drawString(20*mm, 11*mm, 'Group1 | 414551016 | CP2 local review candidate | 2026-11-04')
    canvas.drawRightString(190*mm, 11*mm, str(doc.page))


output = ROOT / 'docs' / 'cp2' / 'Group1_CP2_Report.pdf'
SimpleDocTemplate(str(output), pagesize=(210*mm,297*mm), leftMargin=20*mm, rightMargin=20*mm,
                  topMargin=18*mm, bottomMargin=24*mm, title='Group1 CP2 - Local Review Candidate', author='414551016 / Group1').build(story, onFirstPage=footer, onLaterPages=footer)
print(output)

"""Render the editable CP2 Markdown to PDF without replacing its content."""
import hashlib
import json
import re
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/cp2/Group1_CP2_Report.md'
OUTPUT = SOURCE.with_suffix('.pdf')
font_dir = Path('C:/Windows/Fonts')
pdfmetrics.registerFont(TTFont('CJK', str(font_dir/'msjh.ttc'), subfontIndex=0))
pdfmetrics.registerFont(TTFont('CJK-Bold', str(font_dir/'msjhbd.ttc'), subfontIndex=0))
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='ReportTitle', fontName='Helvetica-Bold', fontSize=20,
                         leading=26, textColor=colors.HexColor('#123c6a'), spaceAfter=12))
styles.add(ParagraphStyle(name='ReportSection', fontName='Helvetica-Bold', fontSize=16,
                         leading=21, textColor=colors.HexColor('#123c6a'), spaceAfter=12))
styles.add(ParagraphStyle(name='ReportSubheading', fontName='Helvetica-Bold', fontSize=11,
                         leading=15, spaceBefore=5, spaceAfter=8))
styles.add(ParagraphStyle(name='ReportBody', fontName='Helvetica', fontSize=10,
                         leading=15, spaceAfter=8, splitLongWords=True))
styles.add(ParagraphStyle(name='ReportCell', parent=styles['ReportBody'], fontSize=9.4,
                         leading=13.5, spaceAfter=0))
story = []
blocks = []


def markup(text):
    text = escape(text)
    text = re.sub(r'&lt;br\s*/?&gt;', '<br/>', text, flags=re.I)
    text = re.sub(r'`([^`]+)`', r'<font face="Courier">\1</font>', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'([\u3400-\u9fff\uf900-\ufaff]+)', r'<font name="CJK">\1</font>', text)
    return text


def paragraph(text, style):
    story.append(Paragraph(markup(text), styles[style]))
    blocks.append(text)


lines = SOURCE.read_text(encoding='utf-8-sig').splitlines()
i = 0
while i < len(lines):
    line = lines[i].strip()
    if not line:
        i += 1
        continue
    heading = re.match(r'^(#{1,6})\s+(.+)$', line)
    if heading:
        level, text = len(heading[1]), heading[2]
        if level == 2 and re.match(r'^\d+\.', text):
            story.append(PageBreak())
        paragraph(text, 'ReportTitle' if level == 1 else 'ReportSection' if level == 2 else 'ReportSubheading')
        i += 1
        continue
    if line.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            cells = [s.strip() for s in re.split(r'(?<!\\)\|', lines[i].strip().strip('|'))]
            if not all(re.fullmatch(r':?-+:?', s.replace(' ', '')) for s in cells):
                rows.append(cells)
                blocks.extend(cells)
            i += 1
        count = len(rows[0])
        if any(len(row) != count for row in rows):
            raise ValueError('Malformed Markdown table')
        widths = [42*mm,128*mm] if count == 2 else [22*mm,42*mm,106*mm] if count == 3 else [170*mm/count]*count
        table = Table([[Paragraph(markup(s), styles['ReportCell']) for s in row] for row in rows],
                      colWidths=widths, repeatRows=1, hAlign='LEFT')
        table.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eaf1f8')),
            ('GRID',(0,0),(-1,-1),.4,colors.HexColor('#c7d1dd')),
            ('VALIGN',(0,0),(-1,-1),'TOP'),
            ('LEFTPADDING',(0,0),(-1,-1),8), ('RIGHTPADDING',(0,0),(-1,-1),8),
            ('TOPPADDING',(0,0),(-1,-1),7), ('BOTTOMPADDING',(0,0),(-1,-1),7),
        ]))
        story.extend([table,Spacer(1,5*mm)])
        continue
    paragraph_lines = [line]
    i += 1
    while i < len(lines) and lines[i].strip() and not lines[i].lstrip().startswith(('#','|')):
        paragraph_lines.append(lines[i].strip())
        i += 1
    paragraph(' '.join(paragraph_lines), 'ReportBody')


def footer(canvas, doc):
    canvas.setStrokeColor(colors.HexColor('#c7d1dd'))
    canvas.line(20*mm,16*mm,190*mm,16*mm)
    canvas.setFont('Helvetica',8)
    canvas.setFillColor(colors.HexColor('#526477'))
    canvas.drawString(20*mm,11*mm,'Group1 | CP2 review candidate | 2026-11-24')
    canvas.drawRightString(190*mm,11*mm,str(doc.page))


SimpleDocTemplate(str(OUTPUT),pagesize=(210*mm,297*mm),leftMargin=20*mm,rightMargin=20*mm,
                  topMargin=18*mm,bottomMargin=24*mm,title='Group1 CP2 Report',author='Group1').build(
                      story,onFirstPage=footer,onLaterPages=footer)

# All content blocks must survive rendering. Headers/footers are not part of the editable body.
from pypdf import PdfReader
reader = PdfReader(OUTPUT)
rendered = ''.join(page.extract_text() or '' for page in reader.pages)


def normalized(text):
    text = re.sub(r'<br\s*/?>', '', text, flags=re.I)
    return re.sub(r'\s+|`|\*\*', '', text)


missing = [text for text in blocks if normalized(text) not in normalized(rendered)]
if missing:
    raise RuntimeError('PDF content missing: '+repr(missing))
validation = {'source':str(SOURCE), 'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              'pdf':str(OUTPUT),'pdf_sha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
              'pages':len(reader.pages),'verified_content_blocks':len(blocks)}
(ROOT/'evidence').mkdir(exist_ok=True)
(ROOT/'evidence/report-export.json').write_text(json.dumps(validation,indent=2),encoding='utf-8')
print(json.dumps(validation,ensure_ascii=False,indent=2))

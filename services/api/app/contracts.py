"""Mirrors frontend report paths; excludes AI triage level and advice."""

FIELDS = {
    "chief_complaint": "text",
    "tocc.fever_cough_cold": "yesno",
    "tocc.fever_cough_cold_details": "text",
    "tocc.travel": "yesno",
    "tocc.travel_details": "text",
    "tocc.occupation": "text",
    "tocc.contact": "yesno",
    "tocc.contact_details": "text",
    "tocc.cluster": "yesno",
    "tocc.cluster_details": "text",
    "measurement.restrictions": "list",
    "measurement.wristband_no_treatment": "bool",
    "measurement.vitals.bp_site": "text",
    "measurement.vitals.bp_sys": "number",
    "measurement.vitals.bp_dia": "number",
    "measurement.vitals.hr": "number",
    "measurement.vitals.spo2": "number",
    "measurement.vitals.temp_c": "number",
    "hpi.onset": "text",
    "hpi.location": "text",
    "hpi.quality": "text",
    "hpi.severity": "text",
    "hpi.course": "text",
    "hpi.aggravating_relieving": "text",
    "hpi.associated_symptoms": "list",
    "hpi.relevant_history": "list",
    "patient.dob": "text",
    "patient.accompanied_by": "text",
    "patient.mobility": "text",
}


def empty_fields():
    return {
        p: {"value": None, "status": "未提及", "source_span": None, "source": "ai"} for p in FIELDS
    }


def valid_value(path, value):
    if value is None:
        return True
    kind = FIELDS[path]
    if kind == "number":
        return type(value) in (int, float) and 0 <= value < 1000
    if kind == "bool":
        return type(value) is bool
    if kind == "list":
        return (
            isinstance(value, list)
            and len(value) <= 30
            and all(isinstance(v, str) and len(v) <= 2000 for v in value)
        )
    if kind == "yesno":
        return value in ("有", "無", "不確定")
    return isinstance(value, str) and len(value) <= 4000

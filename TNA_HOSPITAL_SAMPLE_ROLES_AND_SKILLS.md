# TNA Sample Roles and Skills for Hospital Corporate

Use this document as starter data for Training Needs Analysis (TNA) in a hospital corporate setup.

## Skill level scale (0-5)

- `0` No exposure
- `1` Basic awareness
- `2` Beginner (needs supervision)
- `3` Working proficiency (can work independently)
- `4` Advanced (can guide others)
- `5` Expert (sets standards/coaches teams)

## Sample hospital skill library

| Skill | Description |
|---|---|
| Patient Safety Protocols | Applies patient identification, handoff, and safety checks correctly. |
| Infection Prevention and Control (IPC) | Follows isolation, PPE, and hygiene standards. |
| Electronic Health Records (EHR) | Documents and retrieves patient data accurately in EHR systems. |
| Medication Safety | Applies medication rights, checks interactions, and prevents errors. |
| Clinical Documentation Quality | Writes complete, accurate, and compliant clinical notes. |
| Emergency Response (Code Blue) | Performs emergency protocols and escalation under pressure. |
| Specimen Handling and Quality Control | Manages specimen lifecycle and lab QA steps correctly. |
| Medical Equipment Operation | Uses and troubleshoots hospital equipment safely. |
| Patient Communication and Empathy | Communicates clearly with patients and families. |
| Interdisciplinary Collaboration | Coordinates effectively with nurses, doctors, pharmacy, and admin teams. |
| Regulatory Compliance (DOH/Joint Commission style) | Complies with audits, standards, and internal policies. |
| Data Privacy and Security (HIPAA-like) | Protects confidential patient information in all workflows. |
| Incident Reporting and RCA | Reports incidents and participates in root-cause analysis. |
| Hospital Billing and Claims Accuracy | Prepares coding, billing, and claims with minimal errors. |
| Healthcare Inventory Management | Manages stock, expiration tracking, and reorder workflows. |

## Sample role standards (required skills)

### 1) Staff Nurse (Inpatient)

| Skill | Required Level |
|---|---|
| Patient Safety Protocols | 4 |
| Infection Prevention and Control (IPC) | 4 |
| Medication Safety | 4 |
| Clinical Documentation Quality | 4 |
| Patient Communication and Empathy | 3 |
| Emergency Response (Code Blue) | 3 |

### 2) Nurse Supervisor

| Skill | Required Level |
|---|---|
| Patient Safety Protocols | 5 |
| Infection Prevention and Control (IPC) | 4 |
| Clinical Documentation Quality | 4 |
| Incident Reporting and RCA | 4 |
| Interdisciplinary Collaboration | 4 |
| Regulatory Compliance (DOH/Joint Commission style) | 4 |

### 3) Medical Technologist

| Skill | Required Level |
|---|---|
| Specimen Handling and Quality Control | 5 |
| Infection Prevention and Control (IPC) | 4 |
| Clinical Documentation Quality | 3 |
| Medical Equipment Operation | 4 |
| Data Privacy and Security (HIPAA-like) | 3 |
| Regulatory Compliance (DOH/Joint Commission style) | 3 |

### 4) Pharmacist / Pharmacy Staff

| Skill | Required Level |
|---|---|
| Medication Safety | 5 |
| Clinical Documentation Quality | 3 |
| Healthcare Inventory Management | 4 |
| Patient Communication and Empathy | 3 |
| Regulatory Compliance (DOH/Joint Commission style) | 4 |
| Data Privacy and Security (HIPAA-like) | 3 |

### 5) Infection Control Nurse

| Skill | Required Level |
|---|---|
| Infection Prevention and Control (IPC) | 5 |
| Incident Reporting and RCA | 4 |
| Patient Safety Protocols | 4 |
| Regulatory Compliance (DOH/Joint Commission style) | 4 |
| Interdisciplinary Collaboration | 4 |
| Clinical Documentation Quality | 3 |

### 6) Hospital IT Support

| Skill | Required Level |
|---|---|
| Electronic Health Records (EHR) | 4 |
| Data Privacy and Security (HIPAA-like) | 4 |
| Medical Equipment Operation | 3 |
| Incident Reporting and RCA | 3 |
| Interdisciplinary Collaboration | 3 |
| Regulatory Compliance (DOH/Joint Commission style) | 3 |

### 7) Billing and Claims Officer

| Skill | Required Level |
|---|---|
| Hospital Billing and Claims Accuracy | 5 |
| Clinical Documentation Quality | 3 |
| Data Privacy and Security (HIPAA-like) | 4 |
| Regulatory Compliance (DOH/Joint Commission style) | 4 |
| Interdisciplinary Collaboration | 3 |
| Patient Communication and Empathy | 3 |

## Sample role payload (for TNA role requirement input)

```json
{
  "jobRole": "Staff Nurse (Inpatient)",
  "preAssessmentThreshold": 75,
  "requiredSkills": [
    { "skillName": "Patient Safety Protocols", "requiredLevel": 4 },
    { "skillName": "Infection Prevention and Control (IPC)", "requiredLevel": 4 },
    { "skillName": "Medication Safety", "requiredLevel": 4 },
    { "skillName": "Clinical Documentation Quality", "requiredLevel": 4 },
    { "skillName": "Patient Communication and Empathy", "requiredLevel": 3 },
    { "skillName": "Emergency Response (Code Blue)", "requiredLevel": 3 }
  ]
}
```

## Sample employee skill payload

```json
{
  "employeeId": "EMPLOYEE_ID_HERE",
  "skills": [
    { "skillName": "Patient Safety Protocols", "currentLevel": 3 },
    { "skillName": "Infection Prevention and Control (IPC)", "currentLevel": 3 },
    { "skillName": "Medication Safety", "currentLevel": 2 },
    { "skillName": "Clinical Documentation Quality", "currentLevel": 3 },
    { "skillName": "Patient Communication and Empathy", "currentLevel": 4 },
    { "skillName": "Emergency Response (Code Blue)", "currentLevel": 2 }
  ]
}
```

## Notes

- Keep role names consistent across all TNA steps.
- Reuse the same skill names exactly to avoid duplicates.
- Start with 6-10 critical skills per role, then expand as needed.

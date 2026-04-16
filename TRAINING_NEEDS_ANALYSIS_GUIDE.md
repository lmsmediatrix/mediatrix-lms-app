# Training Needs Analysis (TNA) Guide

## What this page does
The TNA workflow compares:
- role standards (required skills per job role),
- employee current skill levels,
- and optional inputs (pre-test, manager notes, compliance, employee requests)

to generate training recommendations.

## Quick answer to your questions

### 1) "Where do we find the recommended training?"
- In **Step 5: Track Recommendations**, each card currently shows:
  - `Recommended trainings: N` (count only)
  - status (`pending`, `assigned`, `completed`)
- The full recommendation list is saved in the recommendation record under:
  - `recommendedTrainings[]`
- API endpoints that return full details:
  - `GET /tna/recommendation/get/all`
  - `GET /tna/recommendation/employee/:employeeId`

Note: UI currently displays the count in Step 5, not the full itemized list.

### 2) "What is Skill gaps: 1?"
`Skill gaps: 1` means **one required skill failed at least one check**:
- below required level, or
- assessment average for that skill is below that skill's threshold.

Formula used:
- `levelGap = requiredLevel - currentLevel`
- `assessmentGap = skillThreshold - skillAverageScore`
- a skill is counted as a gap when `levelGap > 0` OR `assessmentGap > 0` (when score data exists)

Example:
- Required `Incident Response = 4`
- Employee current `Incident Response = 3`
- Gap = `1` -> counted as one skill gap

## How recommendations are generated
Recommendations are built from these signals:

1. **Skill gaps**
- For each failed skill check, system creates a training recommendation.
- Skill checks are:
  - required level vs current level
  - per-skill threshold vs skill assessment average
- It tries to auto-match a course whose title/description contains the skill name.
- If no course match, fallback title is `Training on <skill>`.

2. **Pre-assessment**
- If score is below threshold, adds `Pre-Assessment Refresher Training`.

3. **Performance gaps** (free text list)
- Each item can produce a recommendation.

4. **Compliance requirements**
- Added as mandatory/optional recommendations.

5. **Manager recommendations** (free text list)

6. **Employee requests** (free text list)

The system merges duplicates and keeps higher priority when conflicts exist.

## Step-by-step (what to put in each step)

## Step 1: Build Skill Library
- Add reusable skills (ex: `Incident Response`, `Endpoint Security`, `Customer Escalation`).

## Step 2: Define Role Standards
- Set `Job Role` (ex: `IT`).
- Add required skills and required level (0-5).
- Set per-skill passing threshold (%).
- Set pre-assessment threshold (default 70).

## Step 3: Capture Employee Skills
- Pick employee.
- Add current level (0-5) for each relevant skill.

## Step 4: Run TNA Analysis
- **Employee**: select target employee.
- **Job Role**: must match role standards.
- **Pre-test score**: optional but recommended.
- **Performance gaps**: comma/new-line list of observed weaknesses.
- **Manager recommendations**: manager-requested topics.
- **Employee requests**: requested learning topics.
- **Compliance signals**: title + optional linked course + mandatory toggle.

## Step 5: Track Recommendations
- Review each generated recommendation card.
- Move status:
  - `pending` -> not yet assigned
  - `assigned` -> assigned/in progress
  - `completed` -> done

## Recommended data-entry format
- Use consistent skill naming (avoid duplicates like `IT support` vs `IT Support`).
- Keep role names standardized (`IT`, `HR`, `Finance Analyst`, etc.).
- For free-text fields, use short actionable phrases.
- Re-run analysis after updating role requirements or employee skills.

## Common confusion and fixes

### "I ran analysis but got few recommendations"
- Check if role required skills were set.
- Check if employee current skills were captured.
- Add performance gaps/manager inputs/compliance if needed.

### "Skill gap count seems wrong"
- Verify required level and employee level are both correct (0-5).
- Verify each skill threshold is correct.
- Verify assessments are linked to sections/courses that match the skill.

### "I only see count, not the full recommended training list"
- Current Step 5 card shows count summary.
- Full detail exists in API response under `recommendedTrainings[]`.

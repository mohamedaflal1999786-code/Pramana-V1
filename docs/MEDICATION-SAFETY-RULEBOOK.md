# Pramana-V1 — Deterministic Medication Safety Rulebook
**Team:** Unknown GenZ  
**Phase:** 06 — AI Clinical Intelligence  
**Standard References:** FDA Drug Safety Communications, RxNorm, KDIGO Clinical Practice Guidelines, AAAAI Penicillin Allergy Guidelines  

---

## 1. Rule Architecture

All clinical safety checks in Pramana-V1 are **deterministic and reproducible**. They do NOT rely on LLM intuition or variable temperature prompting. The LLM only supplies normalized entities (e.g. `warfarin`, `aspirin`, `amoxicillin`, `lisinopril`) and their extracted dosages; the Rule Engine evaluates exact medical criteria against evidence spans.

---

## 2. Active Clinical Safety Rules

### Rule 1: Drug-Drug Interaction (Warfarin + NSAID / Antiplatelet)
- **Clinical Risk:** Severe gastrointestinal and systemic hemorrhage. Concomitant administration elevates INR variability and inhibits platelet aggregation.
- **Trigger Pattern:** Active prescription of `warfarin` alongside any NSAID (`aspirin`, `ibuprofen`, `naproxen`, `ketorolac`, `diclofenac`) or antiplatelet agent (`clopidogrel`, `ticagrelor`).
- **Severity:** Critical
- **Reference Source:** FDA Warfarin Black Box Warning; CHEST Antithrombotic Guidelines.

### Rule 2: Renal Contraindication (Metformin in Severe CKD)
- **Clinical Risk:** Metformin-associated lactic acidosis (MALA), with high mortality rate.
- **Trigger Pattern:** Active prescription of `metformin` where laboratory evidence reports `eGFR < 30 mL/min/1.73m²` or serum creatinine `> 2.0 mg/dL`.
- **Severity:** Critical
- **Reference Source:** KDIGO Clinical Practice Guideline for Diabetes Management in CKD; FDA Metformin Safety Announcement.

### Rule 3: Immunologic Allergy Conflict (Beta-Lactam Cross-Reactivity)
- **Clinical Risk:** Severe Type I IgE-mediated anaphylaxis, airway compromise, cardiovascular collapse.
- **Trigger Pattern:** Documented allergy to `penicillin` (or penicillin derivatives) with an order for `amoxicillin`, `ampicillin`, `piperacillin`, or 1st/2nd generation `cephalosporins`.
- **Severity:** Critical
- **Reference Source:** AAAAI / ACAAI Drug Allergy Practice Parameters; Joint Task Force on Practice Parameters.

### Rule 4: Therapeutic Dosage Boundary (Lisinopril Maximum Daily Limit)
- **Clinical Risk:** Refractory hypotension, hyperkalemia, acute kidney injury.
- **Trigger Pattern:** Single or cumulative daily dose of `lisinopril` exceeding `40 mg/day` without specialist nephrology protocol documented.
- **Severity:** High
- **Reference Source:** FDA Lisinopril Prescribing Information (Max Dose 40mg PO QD).

### Rule 5: Dual RAAS Blockade (ACE Inhibitor + Angiotensin II Receptor Blocker)
- **Clinical Risk:** Significant risk of hyperkalemia, syncope, and renal deterioration without proven cardiovascular mortality benefit.
- **Trigger Pattern:** Co-prescription of an ACE inhibitor (`lisinopril`, `ramipril`, `enalapril`) and an ARB (`losartan`, `valsartan`, `candesartan`).
- **Severity:** High
- **Reference Source:** ONTARGET / ALTITUDE Clinical Trials; ACC/AHA Hypertension Guidelines.

### Rule 6: CYP2C19 Antiplatelet Inhibition (Clopidogrel + Omeprazole)
- **Clinical Risk:** Reduced clopidogrel active metabolite concentration, leading to diminished antiplatelet effect and increased stent thrombosis or recurrent ischemic events.
- **Trigger Pattern:** Co-prescription of `clopidogrel` and `omeprazole` or `esomeprazole`.
- **Severity:** Moderate (Alternative: Pantoprazole)
- **Reference Source:** FDA Drug Safety Communication on Plavix and Prilosec co-administration.

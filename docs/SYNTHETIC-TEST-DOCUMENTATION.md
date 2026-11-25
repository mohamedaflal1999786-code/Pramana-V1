# Synthetic Test Documentation — Phase 05
**Pramana-V1 Healthcare Intelligence Platform**
**Team:** Unknown GenZ
**Compliance Notice:** All test data used across Phase 05 testing consists strictly of synthetic clinical fixtures. No Protected Health Information (PHI) or real patient records were used.

---

## 1. Synthetic Fixture Inventory

### 1.1 Synthetic Patient Record
- **Patient ID**: `00000000-0000-0000-0000-000000000002`
- **Synthetic MRN**: `SYN-MRN-9901`
- **Synthetic Name**: `Jane Doe (Synthetic Test Patient)`
- **Organization**: `00000000-0000-0000-0000-000000000001` (MetroHealth System - Synthetic)

### 1.2 Synthetic Clinical Text Fixture
```text
CLINICAL DISCHARGE SUMMARY
PATIENT: Jane Doe (Synthetic)
DIAGNOSIS: Type 2 Diabetes Mellitus with Mild Renal Impairment
DISCHARGE MEDICATIONS:
1. Metformin 500mg PO BID with meals.
2. Lisinopril 10mg PO daily.
3. Warfarin 2.5mg PO daily.
ALLERGIES:
- Penicillin (Hives, Anaphylaxis)
- Sulfa Drugs (Rash)
LABORATORY FINDINGS:
- Serum Creatinine: 1.8 mg/dL
- eGFR: 42 mL/min/1.73m2
- Potassium: 4.8 mEq/L
```

### 1.3 Synthetic FHIR R4 Bundle Fixture
```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "med-syn-01",
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {
          "text": "Lisinopril 10mg daily",
          "coding": [
            {
              "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
              "code": "314076",
              "display": "Lisinopril 10 MG"
            }
          ]
        }
      }
    },
    {
      "resource": {
        "resourceType": "AllergyIntolerance",
        "id": "allergy-syn-01",
        "clinicalStatus": { "coding": [{ "code": "active" }] },
        "code": { "text": "Penicillin" }
      }
    }
  ]
}
```

### 1.4 Synthetic HL7 v2 Fixture
```hl7
MSH|^~\&|EPIC|METROHEALTH|PRAMANA|HOSPITAL|202611251000||ADT^A08|MSG0001|P|2.5
PID|1||SYN9901^^^METRO||DOE^JANE^SYNTHETIC||19800101|F
PV1|1|I|ICU^01^A
RXE|^1^10000|Lisinopril 10mg|10|mg||PO
AL1|1|DA|^Penicillin|SV|Anaphylaxis
OBX|1|NM|^Serum Creatinine||1.8|mg/dL|0.6-1.2|H
```

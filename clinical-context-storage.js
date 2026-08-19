/* ──────────────────────────────────────────────────────────────────────
   clinical-context-storage.js — Module de stockage pour le contexte
   clinique et les signaux nutritionnels/symptomatiques — Cap Santé

   Étape préparatoire uniquement. Ce fichier N'EST INCLUS PAR AUCUNE PAGE
   tant que ses tests ne sont pas validés — décision qui reste à prendre
   séparément.

   Script classique (pas de module ES) : dépend de `sb` (client Supabase,
   déjà initialisé par la page qui charge ce fichier, comme dans
   conseils.html) et, si présentes, des constantes globales définies dans
   clinical-context.js (CLINICAL_STATUS, CLINICAL_SOURCE, SYMPTOM_TYPES) —
   ce fichier ne les redéfinit jamais, il vérifie seulement leur présence
   avant de les utiliser à titre informatif.

   Ce fichier ne contient :
   - aucun diagnostic, aucune recommandation, aucune agrégation ;
   - aucune association temporelle (evaluateTemporalAssociation() n'est
     jamais appelée ici) ;
   - aucune fonction delete* ;
   - aucun accès à clinical_lab_results, clinical_professionals,
     clinical_patient_assignments, journal, profiles ou bilans.

   Sécurité : ce module ne remplace jamais RLS. Chaque fonction d'écriture
   vérifie localement la session et le consentement actif par défense en
   profondeur, mais la restriction réelle (status forcé à to_verify,
   source forcée à patient_report, interdiction d'écrire verified_by/
   verified_at/reviewed_by/reviewed_at) est imposée par les policies et
   triggers Postgres décrits dans
   supabase/migrations/20260814000000_clinical_context_reference.sql.
   ────────────────────────────────────────────────────────────────────── */

var FORBIDDEN_CLINICAL_WRITE_FIELDS = ['status', 'source', 'verified_by', 'verified_at', 'reviewed_by', 'reviewed_at'];
var FORBIDDEN_CONSENT_IDENTITY_FIELDS = ['user_id', 'purpose'];

function assertConsentFieldsAbsent(payload) {
  payload = payload || {};
  FORBIDDEN_CLINICAL_WRITE_FIELDS.forEach(function (field) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      throw new Error('assertConsentFieldsAbsent: champ interdit dans le payload client: ' + field);
    }
  });
}

// Garde symétrique à assertConsentFieldsAbsent, dédiée à createConsent() :
// user_id (dérivé de la session) et purpose (constante fixe) ne doivent
// jamais être fournis par l'appelant.
function assertConsentIdentityFieldsAbsent(payload) {
  payload = payload || {};
  FORBIDDEN_CONSENT_IDENTITY_FIELDS.forEach(function (field) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      throw new Error('assertConsentIdentityFieldsAbsent: champ interdit dans le payload client: ' + field);
    }
  });
}

function assertCurrentSession() {
  return sb.auth.getSession().then(function (result) {
    var session = result && result.data ? result.data.session : null;
    if (!session || !session.user) {
      throw new Error('assertCurrentSession: session absente, opération refusée');
    }
    return session.user;
  });
}

function getMyActiveConsent() {
  return assertCurrentSession().then(function (currentUser) {
    return sb
      .from('clinical_consents')
      .select('id, purpose, consent_version, granted_at, withdrawn_at')
      .eq('user_id', currentUser.id)
      .eq('purpose', 'clinical_context')
      .is('withdrawn_at', null)
      .maybeSingle();
  }).then(function (res) {
    if (res.error) throw res.error;
    return res.data || null;
  });
}

function assertActiveConsentOrThrow(currentUser) {
  return sb
    .from('clinical_consents')
    .select('id')
    .eq('user_id', currentUser.id)
    .eq('purpose', 'clinical_context')
    .is('withdrawn_at', null)
    .maybeSingle()
    .then(function (res) {
      if (res.error) throw res.error;
      if (!res.data) {
        throw new Error('assertActiveConsentOrThrow: aucun consentement clinique actif, écriture refusée');
      }
      return true;
    });
}

function getMyClinicalEntries() {
  return assertCurrentSession().then(function (currentUser) {
    return sb
      .from('clinical_context_entries')
      .select('id, category, code, label, details, status, source, created_at, updated_at, reviewed_at')
      .eq('user_id', currentUser.id);
  }).then(function (res) {
    if (res.error) throw res.error;
    return res.data || [];
  });
}

function getMySymptoms() {
  return assertCurrentSession().then(function (currentUser) {
    return sb
      .from('clinical_symptoms')
      .select('id, symptom_type, location, occurred_at, intensity, duration_minutes, meal_id, food_groups, stress_context, activity_context, medication_context, cycle_context, patient_comment, status, source, created_at, updated_at, reviewed_at')
      .eq('user_id', currentUser.id);
  }).then(function (res) {
    if (res.error) throw res.error;
    return res.data || [];
  });
}

function getMyLabResultRequests() {
  return assertCurrentSession().then(function (currentUser) {
    return sb
      .from('clinical_lab_result_requests')
      .select('id, request_note, status, created_at, reviewed_at')
      .eq('user_id', currentUser.id);
  }).then(function (res) {
    if (res.error) throw res.error;
    return res.data || [];
  });
}

function createClinicalEntry(payload) {
  payload = payload || {};
  assertConsentFieldsAbsent(payload);
  return assertCurrentSession().then(function (currentUser) {
    return assertActiveConsentOrThrow(currentUser).then(function () {
      var insertPayload = {
        user_id: currentUser.id,
        category: payload.category,
        code: payload.code,
        label: payload.label,
        details: payload.details,
        status: 'to_verify',
        source: 'patient_report'
      };
      return sb.from('clinical_context_entries').insert(insertPayload).select().single();
    });
  }).then(function (res) {
    if (res.error) throw res.error;
    return res.data;
  });
}

function updateClinicalEntry(entryId, payload) {
  payload = payload || {};
  assertConsentFieldsAbsent(payload);
  if (!entryId || typeof entryId !== 'string') {
    throw new Error('updateClinicalEntry: entryId invalide');
  }
  return assertCurrentSession().then(function (currentUser) {
    return assertActiveConsentOrThrow(currentUser).then(function () {
      var updatePayload = {
        code: payload.code,
        label: payload.label,
        details: payload.details
      };
      return sb
        .from('clinical_context_entries')
        .update(updatePayload)
        .eq('id', entryId)
        .eq('user_id', currentUser.id)
        .select()
        .maybeSingle();
    });
  }).then(function (res) {
    if (res.error) throw res.error;
    return res.data;
  });
}

function createSymptom(payload) {
  payload = payload || {};
  assertConsentFieldsAbsent(payload);
  return assertCurrentSession().then(function (currentUser) {
    return assertActiveConsentOrThrow(currentUser).then(function () {
      var insertPayload = {
        user_id: currentUser.id,
        symptom_type: payload.symptom_type,
        location: payload.location,
        occurred_at: payload.occurred_at,
        intensity: payload.intensity,
        duration_minutes: payload.duration_minutes,
        meal_id: payload.meal_id,
        food_groups: payload.food_groups,
        stress_context: payload.stress_context,
        activity_context: payload.activity_context,
        medication_context: payload.medication_context,
        cycle_context: payload.cycle_context,
        patient_comment: payload.patient_comment,
        status: 'to_verify',
        source: 'patient_report'
      };
      return sb.from('clinical_symptoms').insert(insertPayload).select().single();
    });
  }).then(function (res) {
    if (res.error) throw res.error;
    return res.data;
  });
}

function createLabResultRequest(payload) {
  payload = payload || {};
  assertConsentFieldsAbsent(payload);
  return assertCurrentSession().then(function (currentUser) {
    return assertActiveConsentOrThrow(currentUser).then(function () {
      var insertPayload = {
        user_id: currentUser.id,
        request_note: payload.request_note
      };
      return sb.from('clinical_lab_result_requests').insert(insertPayload).select().single();
    });
  }).then(function (res) {
    if (res.error) throw res.error;
    return res.data;
  });
}

// createConsent() — seule fonction d'écriture du module qui ne dépend
// d'aucun consentement préexistant (logique : c'est elle qui le crée).
// N'impose aucune protection contre les insertions multiples au niveau
// base (aucune contrainte d'unicité sur clinical_consents) : la
// protection contre le double-clic reste de la responsabilité de la
// page appelante (désactivation du bouton pendant l'appel), documentée
// dans le Document B et non réalisable depuis ce module seul.
function createConsent(payload) {
  payload = payload || {};
  assertConsentIdentityFieldsAbsent(payload);
  if (typeof payload.consent_version !== 'string' || payload.consent_version.trim() === '') {
    throw new Error('createConsent: consent_version requis (colonne NOT NULL)');
  }
  if (typeof payload.consent_text_hash !== 'string' || payload.consent_text_hash.trim() === '') {
    throw new Error('createConsent: consent_text_hash requis (colonne NOT NULL)');
  }
  return assertCurrentSession().then(function (currentUser) {
    var insertPayload = {
      user_id: currentUser.id,
      purpose: 'clinical_context',
      consent_version: payload.consent_version,
      consent_text_hash: payload.consent_text_hash
    };
    return sb.from('clinical_consents').insert(insertPayload).select().single();
  }).then(function (res) {
    if (res.error) throw res.error;
    return res.data;
  });
}

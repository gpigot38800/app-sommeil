-- ==========================================
-- Script de seed pour le compte DÉMO
-- ==========================================
-- Ce script crée :
-- 1. Une organisation "Hôpital Démo"
-- 2. Un compte admin demo@demo.com (à créer manuellement dans Supabase Auth)
-- 3. Des codes vacation par défaut
-- 4. 12 employés fictifs réalistes
-- 5. Un planning sur 2 semaines avec des violations de conformité pour démonstration

-- ==========================================
-- ÉTAPE 1 : Créer l'organisation démo
-- ==========================================

INSERT INTO organizations (id, name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Hôpital Démo',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- ÉTAPE 2 : Créer le profil admin
-- ==========================================
-- NOTE : Le compte auth demo@demo.com / Demo123! doit être créé manuellement
-- dans Supabase Auth Dashboard, puis récupérer son UUID pour l'insérer ici
-- OU utiliser la fonction suivante après création du compte :

-- Fonction pour lier automatiquement le compte demo@demo.com à l'organisation démo
CREATE OR REPLACE FUNCTION link_demo_admin()
RETURNS void AS $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Récupérer l'ID du user demo@demo.com depuis auth.users
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'demo@demo.com'
  LIMIT 1;

  -- Si trouvé, créer ou mettre à jour le profil admin
  IF demo_user_id IS NOT NULL THEN
    INSERT INTO admin_profiles (id, organization_id, display_name, email, role, created_at)
    VALUES (
      demo_user_id,
      '00000000-0000-0000-0000-000000000001',
      'Admin Démo',
      'demo@demo.com',
      'admin',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      organization_id = EXCLUDED.organization_id,
      display_name = EXCLUDED.display_name,
      email = EXCLUDED.email;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Exécuter la fonction
SELECT link_demo_admin();

-- ==========================================
-- ÉTAPE 3 : Créer les codes vacation
-- ==========================================

INSERT INTO shift_codes (organization_id, code, label, shift_category, default_start_time, default_end_time, default_duration_minutes, includes_break_minutes, is_work_shift)
VALUES
  -- Shifts de travail
  ('00000000-0000-0000-0000-000000000001', 'M', 'Matin', 'jour', '06:00', '14:00', 480, 30, true),
  ('00000000-0000-0000-0000-000000000001', 'S', 'Soir', 'soir', '14:00', '22:00', 480, 30, true),
  ('00000000-0000-0000-0000-000000000001', 'N', 'Nuit', 'nuit', '22:00', '06:00', 480, 30, true),
  ('00000000-0000-0000-0000-000000000001', 'J', 'Journée', 'jour', '08:00', '18:00', 600, 60, true),
  ('00000000-0000-0000-0000-000000000001', 'JL', 'Jour Long', 'jour', '07:00', '19:00', 720, 60, true),
  ('00000000-0000-0000-0000-000000000001', 'NL', 'Nuit Longue', 'nuit', '20:00', '08:00', 720, 60, true),
  -- Repos et absences
  ('00000000-0000-0000-0000-000000000001', 'R', 'Repos', 'repos', NULL, NULL, 0, 0, false),
  ('00000000-0000-0000-0000-000000000001', 'RH', 'Repos Hebdomadaire', 'repos', NULL, NULL, 0, 0, false),
  ('00000000-0000-0000-0000-000000000001', 'RC', 'Repos Compensateur', 'repos', NULL, NULL, 0, 0, false),
  ('00000000-0000-0000-0000-000000000001', 'CA', 'Congé Annuel', 'absence', NULL, NULL, 0, 0, false),
  ('00000000-0000-0000-0000-000000000001', 'RTT', 'RTT', 'absence', NULL, NULL, 0, 0, false),
  ('00000000-0000-0000-0000-000000000001', 'MAL', 'Maladie', 'absence', NULL, NULL, 0, 0, false),
  ('00000000-0000-0000-0000-000000000001', 'FM', 'Formation', 'absence', NULL, NULL, 0, 0, false)
ON CONFLICT DO NOTHING;

-- ==========================================
-- ÉTAPE 4 : Créer les employés
-- ==========================================

INSERT INTO employees (id, organization_id, matricule, first_name, last_name, department, position, employment_type, contract_hours_per_week, habitual_sleep_time, habitual_wake_time, is_active)
VALUES
  -- Urgences
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'E001', 'Sophie', 'Martin', 'Urgences', 'Infirmière', 'temps_plein', 35, '23:00', '07:00', true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'E002', 'Thomas', 'Bernard', 'Urgences', 'Infirmier', 'temps_plein', 35, '22:30', '06:30', true),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'E003', 'Marie', 'Dubois', 'Urgences', 'Aide-Soignante', 'temps_plein', 35, '23:30', '07:30', true),

  -- Réanimation
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'E004', 'Lucas', 'Petit', 'Réanimation', 'Infirmier', 'temps_plein', 35, '23:00', '07:00', true),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'E005', 'Emma', 'Robert', 'Réanimation', 'Infirmière', 'temps_plein', 35, '22:00', '06:00', true),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'E006', 'Hugo', 'Richard', 'Réanimation', 'Aide-Soignant', 'temps_partiel', 28, '00:00', '08:00', true),

  -- Médecine Interne
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'E007', 'Léa', 'Moreau', 'Médecine', 'Infirmière', 'temps_plein', 35, '23:00', '07:00', true),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'E008', 'Nathan', 'Simon', 'Médecine', 'Infirmier', 'temps_plein', 35, '23:30', '07:30', true),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'E009', 'Chloé', 'Laurent', 'Médecine', 'Aide-Soignante', 'temps_plein', 35, '22:30', '06:30', true),

  -- Chirurgie
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'E010', 'Arthur', 'Lefebvre', 'Chirurgie', 'Infirmier', 'temps_plein', 35, '23:00', '07:00', true),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'E011', 'Camille', 'Roux', 'Chirurgie', 'Infirmière', 'temps_plein', 35, '22:00', '06:00', true),
  ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'E012', 'Louis', 'Garcia', 'Chirurgie', 'Aide-Soignant', 'interimaire', 35, '23:30', '07:30', true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- ÉTAPE 5 : Créer un planning sur 2 semaines
-- ==========================================
-- Planning avec des cas critiques pour démonstration :
-- - Quick returns (<11h entre shifts)
-- - Nuits consécutives (3+)
-- - Dépassements horaires hebdomadaires
-- - Jours consécutifs sans repos (7+)

-- Fonction helper pour créer des shifts
CREATE OR REPLACE FUNCTION create_demo_shift(
  emp_id uuid,
  shift_date date,
  code text,
  start_t time,
  end_t time,
  type_shift text,
  break_min integer DEFAULT 30
)
RETURNS void AS $$
BEGIN
  INSERT INTO work_shifts (organization_id, employee_id, start_date, end_date, shift_type, start_time, end_time, shift_code, break_minutes)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    emp_id,
    shift_date,
    shift_date,
    type_shift,
    start_t,
    end_t,
    code,
    break_min
  );
END;
$$ LANGUAGE plpgsql;

-- Semaine 1 (du lundi au dimanche)
DO $$
DECLARE
  start_date date := CURRENT_DATE - INTERVAL '7 days';
BEGIN
  -- Sophie Martin (E001) - Urgences - Cas critique : 4 nuits consécutives
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date, 'N', '22:00', '06:00', 'nuit', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date + 1, 'N', '22:00', '06:00', 'nuit', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date + 2, 'N', '22:00', '06:00', 'nuit', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date + 3, 'N', '22:00', '06:00', 'nuit', 30); -- VIOLATION : 4 nuits
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date + 4, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date + 5, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date + 6, 'M', '06:00', '14:00', 'jour', 30);

  -- Thomas Bernard (E002) - Urgences - Quick return
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date + 1, 'M', '06:00', '14:00', 'jour', 30); -- VIOLATION : 8h entre shifts
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date + 2, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date + 3, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date + 4, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date + 5, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date + 6, 'M', '06:00', '14:00', 'jour', 30);

  -- Marie Dubois (E003) - Urgences - 7 jours consécutifs
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date + 1, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date + 2, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date + 3, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date + 4, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date + 5, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date + 6, 'M', '06:00', '14:00', 'jour', 30); -- VIOLATION : 7 jours

  -- Lucas Petit (E004) - Réanimation - Horaires normaux
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date + 1, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date + 2, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date + 3, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date + 4, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date + 5, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date + 6, 'N', '22:00', '06:00', 'nuit', 30);

  -- Emma Robert (E005) - Réanimation - Shift long dépassant 12h
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000005', start_date, 'JL', '07:00', '20:00', 'jour', 60); -- VIOLATION : 13h (780 min)
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000005', start_date + 1, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000005', start_date + 2, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000005', start_date + 3, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000005', start_date + 4, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000005', start_date + 5, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000005', start_date + 6, 'S', '14:00', '22:00', 'soir', 30);

  -- Hugo Richard (E006) - Réanimation - Temps partiel, horaires normaux
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000006', start_date, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000006', start_date + 2, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000006', start_date + 4, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000006', start_date + 6, 'M', '06:00', '14:00', 'jour', 30);

  -- Autres employés (horaires variés mais conformes)
  -- Léa Moreau (E007)
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000007', start_date, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000007', start_date + 1, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000007', start_date + 2, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000007', start_date + 3, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000007', start_date + 4, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000007', start_date + 5, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000007', start_date + 6, 'N', '22:00', '06:00', 'nuit', 30);
END $$;

-- Semaine 2 (semaine actuelle)
DO $$
DECLARE
  start_date date := CURRENT_DATE;
BEGIN
  -- Sophie Martin (E001) - Suite après nuits : retour à la normale
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date + 1, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date + 2, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date + 3, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date + 4, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date + 5, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000001', start_date + 6, 'R', NULL, NULL, 'repos', 0);

  -- Thomas Bernard (E002) - Horaires variés
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date + 1, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date + 2, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date + 3, 'N', '22:00', '06:00', 'nuit', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date + 4, 'N', '22:00', '06:00', 'nuit', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date + 5, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000002', start_date + 6, 'R', NULL, NULL, 'repos', 0);

  -- Marie Dubois (E003) - Repos après 7 jours consécutifs
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date + 1, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date + 2, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date + 3, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date + 4, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date + 5, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000003', start_date + 6, 'S', '14:00', '22:00', 'soir', 30);

  -- Continuer pour les autres employés...
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date, 'N', '22:00', '06:00', 'nuit', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date + 1, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date + 2, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date + 3, 'M', '06:00', '14:00', 'jour', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date + 4, 'R', NULL, NULL, 'repos', 0);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date + 5, 'S', '14:00', '22:00', 'soir', 30);
  PERFORM create_demo_shift('10000000-0000-0000-0000-000000000004', start_date + 6, 'S', '14:00', '22:00', 'soir', 30);
END $$;

-- ==========================================
-- Nettoyage
-- ==========================================

DROP FUNCTION IF EXISTS create_demo_shift;

-- ==========================================
-- Instructions finales
-- ==========================================

-- Pour activer le compte démo :
-- 1. Aller dans Supabase Dashboard > Authentication > Users
-- 2. Créer un nouveau user :
--    - Email: demo@demo.com
--    - Password: Demo123!
--    - Confirm email: YES (cocher)
-- 3. Exécuter : SELECT link_demo_admin();

SELECT 'Seed démo terminé ! Créez maintenant le compte demo@demo.com dans Supabase Auth.' AS message;

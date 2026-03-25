# Miss & Master IAI Mbalmayo — V1 (Correction projet existant)

> Version recommandee si tu as deja un site deploye avec votes et candidats existants.
> Corrige les bugs, ajoute les nouvelles fonctionnalites, CONSERVE toutes tes donnees.

---

## Ce qui a change vs l'ancienne version

| Probleme | Solution |
|---|---|
| Erreur "error sending confirmation email" | Inscription directe sans confirmation email |
| Cartes trop grandes sur mobile | Taille adaptive — 2 colonnes sur mobile |
| Pas de lien individuel par candidat | Page /candidats/[slug] — URL unique par candidat |
| Pas de QR Code | Page /qr — QR telechargeable pour site et chaque candidat |
| Pas de bouton partager | Bouton natif mobile + copie URL desktop |

---

## Stack technique

- Frontend + API : Next.js 14 — Gratuit sur Vercel
- Base de donnees : Supabase PostgreSQL — Gratuit (500 Mo)
- Authentification : Supabase Auth — Gratuit
- Stockage photos : Supabase Storage — Gratuit (1 Go)

---

## ETAPE 1 — Mettre a jour la base de donnees Supabase

> Cette etape ajoute seulement la colonne "slug". Tes votes et candidats sont conserves.

1. Va sur https://supabase.com -> ton projet
2. Clique SQL Editor dans le menu gauche -> New query
3. Copie-colle le contenu du fichier supabase-schema.sql (inclus dans ce dossier)
4. Clique Run -> tu dois voir "Success. No rows returned"

Ce script fait uniquement :
- Ajoute la colonne slug (lien unique) si elle n'existe pas
- Genere automatiquement un slug pour tes candidats existants
- Met a jour les fonctions RPC anti-doublon
- Met a jour les politiques RLS

---

## ETAPE 2 — Mettre a jour le code sur Vercel via GitHub

1. Decompose ce ZIP sur ton ordinateur
2. Copie tous les fichiers dans ton repo GitHub existant (remplace tout)
3. Dans le terminal :

   git add .
   git commit -m "V1 correction auth + QR code + liens candidats"
   git push

4. Vercel detecte le push et redéploie automatiquement (2-3 min)

---

## ETAPE 3 — Variables d'environnement Vercel

Va dans : Vercel -> ton projet -> Settings -> Environment Variables

### Variable a AJOUTER (nouvelle)

| Nom | Valeur |
|---|---|
| NEXT_PUBLIC_SITE_URL | https://miss-master-iai.vercel.app |

Remplace l'URL par ton URL exacte sur Vercel (pour les QR codes).

### Variables deja presentes a verifier

| Nom | Exemple |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | https://abcdef.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbGci... |
| NEXT_PUBLIC_ADMIN_EMAIL | admin@iai-mbalmayo.cm |
| NEXT_PUBLIC_EDITION | 2025 |
| NEXT_PUBLIC_VOTE_START_DATE | 2025-10-01T00:00:00 |
| NEXT_PUBLIC_VOTE_END_DATE | 2025-12-31T23:59:59 |

Format des dates : AAAA-MM-JJTHH:MM:SS
Exemple : 2025-11-30T20:00:00 = 30 novembre 2025 a 20h00

---

## ETAPE 4 — Verification apres deploiement

Teste ces points apres le deploiement :

- La page d'accueil affiche tes candidats avec leurs votes
- Cliquer sur un candidat ouvre le modal avec le bouton voter
- L'inscription fonctionne sans confirmation email
- Aller sur /candidats/slug-du-candidat affiche bien sa page
- La page /qr genere les QR codes
- Se connecter avec l'email admin donne acces a /admin
- L'admin peut ajouter / modifier / supprimer un candidat

---

## Comment s'authentifier comme admin

L'email admin est defini par NEXT_PUBLIC_ADMIN_EMAIL dans Vercel.
Si tu n'as pas encore de compte avec cet email :

1. Va sur /connexion -> S'inscrire
2. Utilise exactement l'email defini dans NEXT_PUBLIC_ADMIN_EMAIL
3. Apres connexion, le bouton Admin apparait dans la navigation

---

## Utilisation quotidienne

### Ajouter un candidat
Admin -> Candidats -> + Ajouter -> remplir le formulaire -> Ajouter
La photo est uploadee dans Supabase Storage automatiquement.

### Modifier un candidat
Admin -> Candidats -> bouton Modifier -> changer les infos -> Sauvegarder

### Supprimer un candidat
Admin -> Candidats -> bouton Suppr. -> confirmer
Attention : supprime aussi tous les votes de ce candidat.

### Suivre les votes
- Page /resultats : classement visible par tous, temps reel
- Admin -> Tableau de bord : stats completes

### Generer un QR Code
1. Va sur /qr
2. Choisis : site entier ou un candidat specifique
3. Telecharger le QR Code -> PNG pret a imprimer

---

## Chaque annee — nouvelle edition

### Etape 1 : Supprimer les donnees
Admin -> Parametres -> Reinitialiser toutes les donnees -> confirmer
Tous les candidats et votes sont supprimes. Les comptes utilisateurs restent.

### Etape 2 : Mettre a jour les dates
Dans Vercel -> Settings -> Environment Variables, modifie :

  NEXT_PUBLIC_EDITION          = 2026
  NEXT_PUBLIC_VOTE_START_DATE  = 2026-10-01T00:00:00
  NEXT_PUBLIC_VOTE_END_DATE    = 2026-12-31T23:59:59

Clique Save -> Vercel redéploie automatiquement.

### Etape 3 : Ajouter les nouveaux candidats
Admin -> Candidats -> + Ajouter (un par un)

---

## Problemes frequents

### "Non autorise" dans l'admin
L'email utilise pour se connecter est different de NEXT_PUBLIC_ADMIN_EMAIL.
Verifie que les deux correspondent exactement (pas d'espace, meme casse).

### Les photos ne s'affichent pas
Le bucket "photos" n'est pas en mode Public dans Supabase.
Solution : Supabase -> Storage -> photos -> Edit bucket -> cocher Public bucket.

### Un utilisateur vote plusieurs fois
Avec V1 (sans confirmation email), quelqu'un peut creer plusieurs comptes.
La contrainte UNIQUE en base empeche 2 votes avec le meme compte.
Pour empecher totalement la triche -> passe a la V2 (Supabase + Resend).

### Le slug d'un candidat ne marche pas
Dans Supabase -> SQL Editor, execute :
  UPDATE candidates
  SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'))
          || '-' || SUBSTRING(id::text, 1, 4)
  WHERE slug IS NULL OR slug = '';

### Le site ne se redéploie pas
Vercel -> ton projet -> Deployments -> Redeploy sur le dernier deploiement.

---

## Structure du projet

  v1-correction/
  app/
    page.tsx                   Page principale (grille des candidats)
    layout.tsx                 Layout global (header + footer)
    globals.css                Styles globaux
    connexion/page.tsx         Inscription / Connexion
    resultats/page.tsx         Classement en temps reel
    candidats/[slug]/page.tsx  Page individuelle d'un candidat
    qr/page.tsx                Generateur de QR codes
    admin/page.tsx             Panneau d'administration
    api/
      votes/route.ts           POST - enregistrer un vote
      candidates/route.ts      GET liste / POST creer
      candidates/[id]/route.ts PUT modifier / DELETE supprimer
      admin/reset/route.ts     DELETE - reinitialiser les donnees
      admin/upload/route.ts    POST - uploader une photo
  components/
    Header.tsx                 Navigation + connexion
    Countdown.tsx              Compte a rebours
    CandidateCard.tsx          Carte candidat
    CandidateModal.tsx         Modal de vote
  lib/
    supabase.ts                Client Supabase (navigateur)
    supabase-server.ts         Client Supabase (serveur)
    config.ts                  Dates concours + isAdmin()
    types.ts                   Types TypeScript
  supabase-schema.sql          Script SQL pour Supabase
  .env.local.example           Template variables d'environnement
  README.md                    Ce fichier

---

## Securite

- Anti-doublon base de donnees : UNIQUE(user_id, candidate_id) — impossible a contourner
- Anti-doublon par categorie : 1 vote max par categorie Miss ou Master par compte
- Protection admin : verification email cote serveur sur toutes les routes admin
- RLS Supabase : chaque utilisateur ne voit que ses propres votes

---

Institut Africain d'Informatique - Mbalmayo, Cameroun - Edition 2025

---

## Modifications recentes

### Retrait de vote
Un utilisateur peut retirer son vote tant que le concours est ouvert.
- Ouvrir la fiche d'un candidat pour lequel il a vote
- Un bouton "Retirer mon vote" apparait en rouge sous le bouton de vote
- Une confirmation est demandee avant suppression
- Le compteur se decremente immediatement
- L'utilisateur peut ensuite revoter pour un autre candidat de la meme categorie

Fichiers modifies :
  components/CandidateModal.tsx   Bouton retrait + confirmation
  app/api/votes/route.ts          Ajout methode DELETE
  app/page.tsx                    Gestion onVoteRemoved
  supabase-schema.sql (V1/V2)     Ajout fonction decrement_vote
  neon-schema.sql (V3)            Pas de changement necessaire (GREATEST natif)

### Footer — Développé par Xhris Dior
Le footer affiche maintenant "Développé par Xhris Dior" avec un lien
vers le portfolio. Le texte est en doré (#C9A84C) pour indiquer
qu'il est cliquable.

Pour mettre ton lien portfolio :
1. Ouvre le fichier app/layout.tsx
2. Trouve la ligne : href="VOTRE_LIEN_PORTFOLIO_ICI"
3. Remplace par ton URL : href="https://xhrisdior.com" (par exemple)
4. Sauvegarde -> git push -> Vercel redéploie automatiquement

Fichiers modifies :
  app/layout.tsx    Footer avec lien Xhris Dior

# CONTEXTE DU PROJET : TAUPITUNNEL (Eurotunnel Innovation Sprint)

## 1. Résumé du Projet
Le projet s'appelle "Taupitunnel". C'est une application web mobile-first déclenchée par un tag NFC. Elle sert d'agent vocal IA (une mascotte) pour recueillir les avis à chaud des usagers d'Eurotunnel (Le Shuttle) pendant leur traversée sous la Manche (35 minutes d'attente dans leur véhicule).
L'objectif est de remplacer les longs questionnaires par e-mail ("survey fatigue") par une interaction vocale ludique, personnalisée et ultra-rapide.

## 2. Utilisateurs Cibles (Personas)
- Jade (34 ans) : Veut s'investir et donner son avis, mais trouve les e-mails tardifs inutiles.
- Harry (Senior) : A besoin d'une interface ultra-accessible, sans clavier, où il suffit de parler.
- Hubert (Pressé) : Déteste perdre du temps et le spam, a besoin d'une action immédiate et sans friction.

## 3. Stack Technique & Règles de Code
- **Frontend :** React (ou Next.js), Tailwind CSS.
- **Approche :** Strictement Mobile-First. L'application doit ressembler à une application native sur un écran de smartphone (h-screen, pas de scroll inutile, gros boutons).
- **Style Visuel :** Minimaliste, épuré, accessible. Utiliser les couleurs inspirées d'Eurotunnel (Bleu marine profond, touches de Bordeaux/Violet, fond clair ou dark mode élégant).
- **Composants :** Utiliser des composants fonctionnels et les React Hooks (`useState`, `useEffect`, `useRef`).

## 4. Fonctionnalités Clés de l'Interface (UI/UX)
L'interface est centrée sur l'interaction vocale. Il n'y a pas de longs formulaires.
- **Gestion du Micro :** Le code doit impérativement gérer la demande d'autorisation du microphone (API `navigator.mediaDevices.getUserMedia`) avec un fallback élégant si l'utilisateur refuse.
- **États de l'Agent IA :** L'interface doit refléter visuellement 3 états principaux :
  1. `idle` (Au repos) : Prêt à commencer.
  2. `listening` (L'utilisateur parle) : Animations d'ondes sonores (pulse/ping en Tailwind) pour montrer que l'app écoute. Bouton rouge pour couper.
  3. `speaking` (L'IA parle) : Animation différente (ex: glow ou rebond de l'avatar) indiquant que la mascotte répond.
- **Sous-titres (Transcript) :** Prévoir une zone de texte dynamique en bas de l'écran pour afficher ce que l'IA ou l'utilisateur dit en temps réel.

## 5. Directives pour l'IA (Cursor)
- Lors de la génération de code, ne casse jamais l'accessibilité (contraste des couleurs, tailles des boutons touchables).
- Prépare l'architecture pour qu'il soit facile d'injecter un SDK vocal externe (comme Vapi, OpenAI Realtime, ou Retell AI) via des fonctions métier bien isolées (ex: `startAgent()`, `stopAgent()`).
- Reste concis dans le code. Sépare les composants logiques (ex: l'avatar animé) du fichier principal si celui-ci devient trop grand.
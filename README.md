# SK OPTIC - Votre Opticien en Ligne

Application moderne pour SK OPTIC, permettant la consultation du catalogue, la prise de rendez-vous et l'analyse d'ordonnances par IA.

## 🚀 Déploiement sur GitHub Pages

Ce projet est configuré pour être déployé automatiquement sur GitHub Pages via les **GitHub Actions**.

### 🛠️ Configuration Initiale

1.  **Créez un dépôt sur GitHub** nommé `SK-OPTIC`.
2.  **Exportez ce projet** vers votre dépôt GitHub (via le menu "Settings" de Google AI Studio).
3.  **Configurez les Secrets GitHub** :
    Allez dans **Settings > Secrets and variables > Actions** de votre dépôt GitHub et ajoutez les secrets suivants :
    *   `GEMINI_API_KEY` : Votre clé API Google AI Studio.
    *   `VITE_FIREBASE_API_KEY` :
    *   `VITE_FIREBASE_AUTH_DOMAIN` : 
    *   `VITE_FIREBASE_PROJECT_ID` : 
    *   `VITE_FIREBASE_APP_ID` : 
    *   `VITE_FIREBASE_DATABASE_ID` : `(default)`

### 🛡️ Sécurité & Restrictions

Pour protéger vos clés API sur un site public :

*   **Google Cloud Console** : Modifiez votre `GEMINI_API_KEY` pour ajouter une restriction de type "Sites Web" avec l'URL de votre site GitHub Pages (`https://<votre-nom>.github.io/SK-OPTIC/*`).
*   **Firebase Console** : Ajoutez votre domaine GitHub Pages (`<votre-nom>.github.io`) à la liste des domaines autorisés dans la section **Authentication > Settings > Authorized domains**.

### 📂 Structure du Projet

*   `src/` : Code source React (TypeScript).
*   `.github/workflows/deploy.yml` : Configuration du déploiement automatique.
*   `firestore.rules` : Règles de sécurité pour la base de données.
*   `firebase-blueprint.json` : Structure de la base de données.

## 💻 Développement Local

1.  `npm install`
2.  `npm run dev`

L'application sera accessible sur `http://localhost:3000`.

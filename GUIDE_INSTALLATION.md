# 🪱 Guide d'installation — Spice Bot (Dune Awakening)
### Muppet's of Rodin

---

## ÉTAPE 1 — Créer le bot sur Discord Developer Portal

1. Va sur **https://discord.com/developers/applications**
2. Clique sur **"New Application"**
3. Donne-lui un nom (ex: `SpiceBot`)
4. Va dans l'onglet **"Bot"** (menu gauche)
5. Clique **"Add Bot"** → confirme
6. Sous **"TOKEN"**, clique **"Reset Token"** → copie ce token (garde-le secret !)
7. Active ces options dans **"Privileged Gateway Intents"** :
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT

---

## ÉTAPE 2 — Inviter le bot sur ton serveur

1. Va dans l'onglet **"OAuth2"** → **"URL Generator"**
2. Coche dans **SCOPES** : `bot` et `applications.commands`
3. Coche dans **BOT PERMISSIONS** :
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Read Message History
   - ✅ Use Slash Commands
   - ✅ Mention Everyone
4. Copie l'URL générée en bas → ouvre-la → sélectionne ton serveur → **Autoriser**

---

## ÉTAPE 3 — Récupérer les IDs nécessaires

Dans Discord, active le **Mode Développeur** :
> Paramètres → Apparence → Mode développeur ✅

Ensuite :
- **CLIENT_ID** : Clic droit sur le bot dans la liste des membres → "Copier l'ID"
  *(ou dans Developer Portal → ton app → "Application ID")*
- **GUILD_ID** : Clic droit sur le nom de ton serveur → "Copier l'ID du serveur"

---

## ÉTAPE 4 — Installer Node.js

Télécharge et installe **Node.js** (version 18 ou +) :
👉 https://nodejs.org/

Vérifie l'installation :
```bash
node --version
npm --version
```

---

## ÉTAPE 5 — Configurer le bot

1. Crée un dossier `spice-bot` sur ton PC
2. Mets-y les 3 fichiers : `bot.js`, `deploy-commands.js`, `package.json`
3. Crée un fichier `.env` dans ce dossier avec :

```
DISCORD_TOKEN=ton_token_ici
CLIENT_ID=ton_client_id_ici
GUILD_ID=ton_guild_id_ici
```

4. Installe les dépendances. Dans un terminal dans le dossier :
```bash
npm install
npm install dotenv
```

5. Ajoute cette ligne tout en haut de `bot.js` et `deploy-commands.js` :
```js
require('dotenv').config();
```

---

## ÉTAPE 6 — Créer le rôle "Officier Spice" sur Discord

1. Dans ton serveur Discord → Paramètres du serveur → Rôles
2. Crée un rôle nommé exactement : **`Officier Spice`**
3. Assigne-le à ton officier en charge du spice

---

## ÉTAPE 7 — Déployer les commandes slash

```bash
node deploy-commands.js
```
Tu dois voir : `✅ Commandes enregistrées avec succès !`

---

## ÉTAPE 8 — Lancer le bot

```bash
node bot.js
```
Tu dois voir : `✅ Bot connecté en tant que SpiceBot#XXXX`

---

## Utilisation des commandes

| Commande | Description |
|----------|-------------|
| `/spice` | Enregistrer un dépôt de spice (max ou quantité perso) |
| `/historique` | Voir les 5 derniers dépôts |
| `/totaux` | Voir le classement total par membre |

### Fonctionnement de `/spice` :
1. Choisir **max (42 000)** ou **quantité personnalisée**
2. Sélectionner les membres participants
3. Le bot calcule automatiquement :
   - 10% pour la guilde
   - Parts égales entre membres
4. Ping automatique de l'Officier Spice
5. Embed récapitulatif posté dans le canal

---

## Garder le bot allumé 24h/24 (optionnel)

Pour que le bot tourne en permanence, tu peux utiliser :
- **[Railway.app](https://railway.app)** (gratuit, simple)
- **[Render.com](https://render.com)** (gratuit)
- Un Raspberry Pi / serveur personnel

---

## 📁 Fichiers générés automatiquement

| Fichier | Description |
|---------|-------------|
| `spice_data.json` | Historique + totaux (créé au premier dépôt) |

---

*Bot développé pour la guilde Muppet's of Rodin — Dune Awakening* 🪱

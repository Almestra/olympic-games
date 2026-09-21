# Notes d'architecture — Olympic Games

## Sommaire
1. [Résumé rapide](#1-résumé-rapide)
2. [Démarche](#2-démarche)
3. [Problèmes identifiés](#3-problèmes-identifiés)
4. [Écarts avec le cahier des charges](#4-écarts-avec-le-cahier-des-charges)
5. [Limites du projet](#5-limites-du-projet)
6. [Priorités](#6-priorités)
7. [Architecture proposée](#7-architecture-proposée)

## 1. Résumé rapide

L'application fonctionne en apparence, mais :

1. **Les composants font tout** : ils téléchargent les données, les transforment, dessinent les graphiques et gèrent la navigation.
2. **Les données ne sont pas typées** : aucune interface ne décrit leur structure, d'où l'usage répété de `any`.
3. **Deux bugs** : la page détail plante sur un pays inexistant, et les graphiques ne sont jamais détruits (fuite mémoire).
4. **Ni responsive, ni accessible** : pie chart trop petit sur mobile, graphiques sans description, contrastes insuffisants.
5. **Un socle technique à moderniser** : aucun linter, aucun test utile.

**36 problèmes relevés** :
- 🔴 11 de gravité haute : l'utilisateur est bloqué ou reçoit une information fausse, ou un critère d'acceptation n'est pas respecté.
- 🟠 14 de gravité moyenne : dette technique, ou défaut qui gêne une partie des utilisateurs sans les empêcher d'utiliser l'application.
- 🟡 11 de gravité faible : lisibilité, style, modernisation, ou écart sans effet sur l'usage.

## 2. Démarche

Lancement de l'application avec `ng serve`, exploration du rendu et lecture de tous les fichiers.

- **Environnement** : Angular 18.2, TypeScript 5.4, RxJS 7.8, Chart.js 4.5.
- **Tests manuels** (ordinateur, tablette et mobile) :
  - ✅ le dashboard, le clic sur un pays, la page détail et le retour fonctionnent ;
  - ❌ `/country/Eorzea` : erreur JavaScript, indicateurs à 0, aucun message ;
  - ❌ sur mobile, le pie chart est trop petit au point de gêner l'interaction ;
  - ❌ après 5 allers-retours entre le dashboard et la page détail, 10 graphiques restent en mémoire, dont 9 orphelins ;
  - ⚠️ `/page-inexistante` affiche bien la page 404, mais avec des barres de défilement.

- **À noter** :
  - aucun fichier ne dépasse 70 lignes : le problème n'est pas la taille des fichiers, mais le nombre de responsabilités de chacun ;
  - aucun fichier n'est mal rangé : il manque des fichiers et des dossiers (services, modèles, composants réutilisables) ;
  - point positif : les données passent déjà par HTTP (`assets/mock/olympic.json`), ce qui simule une vraie API.

## 3. Problèmes identifiés

Les problèmes de gravité haute sont expliqués sous chaque tableau.

### 3.1 Architecture

| Problème | Où | Gravité |
|---|---|:-:|
| **ARCH-01** — Appels HTTP faits directement dans les composants, avec l'URL du JSON en dur | `home.component.ts` l. 12-22, `country.component.ts` l. 13-27 | 🔴 |
| **ARCH-02** — Calculs métier (totaux, nombre de JO) faits directement dans les composants | `home.component.ts` l. 26-30, `country.component.ts` l. 30-38 | 🔴 |
| **ARCH-03** — Code dupliqué entre le dashboard et la page détail : appel HTTP, bloc titre + indicateurs, création du graphique | `home.component.*`, `country.component.*` | 🔴 |
| **ARCH-04** — Ni `services/`, ni `models/`, ni `components/` : seul `pages/` existe | `src/app/` | 🟠 |
| **ARCH-05** — Organisation en NgModule, alors que les composants standalone sont générés par défaut depuis Angular 17 | `app.module.ts` | 🟡 |

**À noter :**
- **ARCH-01, ARCH-02** : un composant devrait seulement afficher les données et réagir aux actions de l'utilisateur. Isoler l'accès aux données et les calculs métier dans un service permettra de basculer vers une API sans modifier chaque composant. C'est ce que doit résoudre le `DataService` demandé dans le cahier des charges.
- **ARCH-03** : l'appel HTTP relève d'ARCH-01, et la création du graphique reviendra à un composant dédié. Reste le bloc titre + indicateurs, c'est ce que doit résoudre le `HeaderComponent` demandé dans le cahier des charges.

### 3.2 Typage TypeScript

| Problème | Où | Gravité |
|---|---|:-:|
| **TS-01** — Usage répété de `any` sur le dashboard et la page détail, aucune interface `Olympic` ni `Participation` | dashboard, page détail | 🔴 |
| **TS-02** — Nombres convertis en texte puis reconvertis (`toString()` puis `parseInt`), graphique typé en `string[]` | `country.component.ts` l. 35-38 | 🟠 |
| **TS-03** — Assertions `!` (`pieChart!`, `lineChart!`, `error!`) qui masquent l'absence de valeur avant la réponse HTTP | dashboard, page détail | 🟡 |

**À noter :**
- **TS-01** : le cahier des charges interdit l'usage de `any`. De plus, c'est demander à TypeScript de ne pas vérifier une valeur. Une faute de frappe comme `medalCount` au lieu de `medalsCount` compilerait sans erreur et afficherait `NaN`. L'option `"strict": true` du projet n'interdit que les `any` implicites, pas ceux écrits explicitement.

### 3.3 Données, routing et erreurs

| Problème | Où | Gravité |
|---|---|:-:|
| **DATA-01** — Pays inexistant (`/country/Eorzea`) : erreur JavaScript en console, indicateurs à 0, ni message ni redirection | `country.component.ts` l. 30-31 | 🔴 |
| **DATA-02** — Route `country/:countryName` au lieu de `/country/:id` pour accéder à la page détail | `app-routing.module.ts` l. 13 | 🔴 |
| **DATA-03** — Aucun état loading / empty / error : la propriété `error` est remplie mais jamais affichée | dashboard, page détail | 🔴 |
| **DATA-04** — Graphiques jamais détruits (`chart.destroy()` absent) | dashboard, page détail | 🔴 |
| **DATA-05** — Aucun tri des pays : ils suivent l'ordre du fichier JSON | `home.component.ts` l. 27-31 | 🟡 |

**À noter :**
- **DATA-01** : le cahier des charges impose de vérifier que le pays existe. Afficher « 0 médaille » laisse croire que le pays existe mais n'a rien gagné, ce qui est faux.
- **DATA-02** : le cahier des charges précise clairement `/country/:id`. De plus, un nom est fragile (espaces encodés, majuscules, renommage), alors qu'un identifiant est stable et unique.
- **DATA-03** : le cahier des charges impose l'usage de ces trois états. Avec une vraie API (lenteur, panne), l'utilisateur verrait des indicateurs à 0 et aucun graphique, sans explication.
- **DATA-04** : la mémoire occupée augmente à chaque navigation, ce qui ralentit l'application, surtout sur mobile.

### 3.4 Observables (RxJS)

| Problème | Où | Gravité |
|---|---|:-:|
| **RX-01** — `paramMap` et la requête HTTP sont reliés par une variable locale : la page détail ne se rechargerait pas si seul l'identifiant changeait dans l'URL | `country.component.ts` l. 25-30 | 🟠 |
| **RX-02** — `subscribe()` manuels, sans pipe `async` ni désinscription : pas de fuite aujourd'hui, mais un risque dès qu'un flux restera ouvert | dashboard, page détail | 🟠 |
| **RX-03** — Signature `subscribe(succès, erreur)` dépréciée et `.pipe()` vide | dashboard, page détail | 🟡 |
| **RX-04** — Fichier JSON retéléchargé à chaque visite de page | dashboard, page détail | 🟡 |

### 3.5 Clean code

| Problème | Où | Gravité |
|---|---|:-:|
| **CLEAN-01** — `console.log` de debug : données complètes, et erreur affichée sous la forme `[object Object]` | `home.component.ts` l. 24 et 35 | 🟠 |
| **CLEAN-02** — Valeurs en dur et dupliquées : URL du JSON, couleur `#0b868f`, `aspectRatio`, palette du pie chart | dashboard, page détail, `styles.scss` | 🟠 |
| **CLEAN-03** — Nommage flou : `i` réutilisé dans deux fonctions imbriquées, `totalJOs`, `titlePage`, `totalEntries` pour les participations | dashboard, page détail | 🟠 |
| **CLEAN-04** — Styles des pages placés dans le fichier global ; classe `.center` définie deux fois avec deux sens différents | `styles.scss`, `not-found.component.scss` | 🟠 |
| **CLEAN-05** — Code mort : `Router` injecté mais inutilisé, constructeur vide, `.map((i) => i)`, classe `.heading` jamais utilisée, classe `chart-container` jamais définie, image `teleSport.png` inutilisée | plusieurs fichiers | 🟡 |
| **CLEAN-06** — Style incohérent : guillemets, espaces, points-virgules, indentation contraire au `.editorconfig` | plusieurs fichiers | 🟡 |

### 3.6 Interface utilisateur

| Problème | Où | Gravité |
|---|---|:-:|
| **UI-01** — `aspectRatio: 2.5` fixe : sur mobile, le pie chart est trop petit au point de gêner l'interaction | `home.component.ts` l. 54, `country.component.ts` l. 62 | 🔴 |
| **UI-02** — Ni grille 12 / 8 / 4 colonnes, ni points de rupture à 768 et 1200 px : une seule media query, à 1000 px | `country.component.scss` l. 15 | 🔴 |
| **UI-03** — Cartes d'indicateurs sans retour à la ligne : libellés écrasés sur mobile | `styles.scss` l. 19-24 | 🟠 |
| **UI-04** — Page 404 plus grande que l'écran (`100vw` et `100vh`, plus les marges) | `not-found.component.scss` | 🟠 |
| **UI-05** — Titre d'axe simulé par un `<h2>Date</h2>`, légende inutile | `country.component.*` | 🟠 |
| **UI-06** — Retour sous forme de lien texte « Go back » en bas de page au lieu d'un bouton | `country.component.html` l. 28 | 🟡 |

**À noter :**
- **UI-01, UI-02** : l'US-05 (visiteur mobile) n'est pas satisfaite : les parts du pie chart sont trop petites pour être touchées du doigt.

### 3.7 Accessibilité

| Problème | Où | Gravité |
|---|---|:-:|
| **A11Y-01** — Graphiques sans alternative textuelle (ni `role`, ni `aria-label`), contenu de repli du canvas égal à `[object Object]` | `home.component.html` l. 19, `country.component.html` l. 23 | 🔴 |
| **A11Y-02** — Contrastes sous le seuil AA : le texte en gris sur blanc, le texte d'en-tête en blanc sur bleu-vert, plusieurs parts du pie chart, la ligne du line chart ; pays distingués par la seule couleur avec une légende à part | `styles.scss`, `home.component.ts` l. 49, `country.component.ts` | 🟠 |
| **A11Y-03** — Ni `<h1>` ni `<main>` ; le seul titre de la page détail est `<h2>Date</h2>` | templates des pages | 🟠 |

**À noter :**
- **A11Y-01** : une personne qui utilise un lecteur d'écran ne peut pas comprendre les graphiques.

### 3.8 Outillage et dépendances

| Problème | Où | Gravité |
|---|---|:-:|
| **TOOL-01** — Aucun linter (`ng lint` non configuré) ni formateur | `angular.json` | 🟠 |
| **TOOL-02** — Aucun test utile : 6 tests générés automatiquement, qui ne compilent pas | `*.spec.ts` | 🟡 |
| **TOOL-03** — Configuration héritée (`browserTarget` déprécié, ancien builder webpack, `polyfills.ts`) et README obsolète | `angular.json`, `README.md` | 🟡 |
| **TOOL-04** — Dépendances inutilisées : `@angular/animations`, `@angular/forms`, `@angular/platform-server`, `@types/express` | `package.json` | 🟡 |

## 4. Écarts avec le cahier des charges

| Exigence | État actuel | Réf. |
|---|---|---|
| `ng serve` sans erreur | ✅ Avec des avertissements | TOOL-03 |
| Fichiers de moins de 300 lignes | ✅ 70 lignes au maximum | — |
| Dashboard présentant le contexte | ⚠️ Aucun texte introductif | — |
| Graphique des médailles par pays | ⚠️ Présent, mais ni responsive ni accessible | UI-01, A11Y-01 |
| Clic sur un pays → `/country/:id` | ❌ Navigation par nom | DATA-02 |
| Indicateurs et graphique d'évolution du pays | ⚠️ Présents, mais calculés dans le composant | ARCH-02, UI-05 |
| Bouton de retour (`routerLink="/"`) | ⚠️ Lien « Go back » en bas de page | UI-06 |
| Gestion d'un identifiant invalide | ❌ Erreur JavaScript | DATA-01 |
| États loading / empty / error | ❌ Absents | DATA-03 |
| Tri cohérent Dashboard ↔ Page détail | ❌ Aucun tri | DATA-05 |
| `HeaderComponent` réutilisable | ❌ HTML dupliqué | ARCH-03 |
| `DataService` centralisant les données | ❌ Appels HTTP dans les composants | ARCH-01 |
| Interfaces TypeScript, zéro `any` | ❌ Usage répété de `any` | TS-01 |
| Constantes factorisées | ❌ Valeurs dupliquées | CLEAN-02 |
| Responsive 12 / 8 / 4 colonnes | ❌ Une seule media query | UI-02 |
| Contrastes AA, ARIA, descriptions des graphiques | ❌ Absents | A11Y-01 à A11Y-03 |
| README et `ARCHITECTURE.md` | ❌ README obsolète, pas d'`ARCHITECTURE.md` | TOOL-03 |

## 5. Limites du projet

- **Angular 18** : version imposée par le client, bien qu'elle ne soit plus maintenue (9 vulnérabilités signalées dans ses paquets).
- **Navigation au clic** : le client ne demande pas de navigation au clavier. Depuis le dashboard, la page détail reste donc inaccessible au clavier.

## 6. Priorités

1. **Fondations** : interfaces et `DataService` (**TS-01**, **ARCH-01**, **ARCH-02**).
2. **Bugs et écarts majeurs** : identifiant dans l'URL, pays inexistant, états loading / empty / error, destruction des graphiques (**DATA-01** à **DATA-04**).
3. **Composants réutilisables** : `HeaderComponent`, composant de graphique (**ARCH-03**).
4. **Responsive et accessibilité** (**UI**, **A11Y**).
5. **Nettoyage et documentation** : constantes, code mort, README, `ARCHITECTURE.md` (**CLEAN**, **TOOL-03**).

## 7. Architecture proposée

Cette architecture répond aux problèmes de structure relevés plus haut ; le nettoyage et l'outillage se traitent à l'implémentation.

### 7.1 Arborescence

```text
src/
├── app/
│   ├── components/
│   │   ├── chart/                   graphique Chart.js (bar ou line)
│   │   ├── header/                  titre de page et indicateurs
│   │   ├── page-status/             chargement, absence de données, erreur
│   │   └── top-bar/                 nom de l'application
│   ├── models/
│   │   ├── chart-item.model.ts      élément de graphique (identifiant, libellé, valeur)
│   │   ├── indicator.model.ts       indicateur (libellé, valeur)
│   │   ├── olympic.model.ts         pays et ses participations
│   │   ├── page-state.model.ts      'loading' | 'empty' | 'error' | 'loaded'
│   │   └── participation.model.ts   participation à une édition
│   ├── pages/
│   │   ├── country-detail-page/     /country/:id
│   │   ├── dashboard-page/          /
│   │   └── not-found-page/          /not-found et routes inconnues
│   ├── services/
│   │   └── data.service.ts          unique point d'accès aux données
│   ├── app.component.ts             composant racine : barre supérieure, <main> et <router-outlet>
│   ├── app.config.ts                fournisseurs : routeur et HttpClient
│   └── app.routes.ts                table des routes
├── assets/
│   └── mock/
│       └── olympic.json             réponse simulée de l'API
├── environments/                    adresse des données
├── styles/
│   └── _variables.scss              couleurs et points de rupture
├── main.ts                          démarrage avec bootstrapApplication
└── styles.scss                      fondations globales
```

Les dossiers absents `components/`, `models/` et `services/` sont ajoutés (**ARCH-04**).

### 7.2 Patterns retenus

- **Séparation Composant / Service.** Le service récupère et calcule, les composants affichent (**ARCH-01**, **ARCH-02**).
- **Composants Conteneur / Présentation.** Les pages (`pages/`), qui jouent le rôle de conteneurs, injectent le service, préparent les données d'affichage et gèrent la navigation. Les composants de présentation (`components/`) reçoivent tout par `@Input`, signalent les actions par `@Output`, et n'injectent aucun service : ils sont réutilisables peu importe la page (**ARCH-03**). Les pages s'abonnent aux données avec le pipe `async` plutôt qu'avec des `subscribe()` manuels : les souscriptions se ferment seules (**RX-02**), la signature dépréciée disparaît avec eux (**RX-03**), et aucune propriété n'a besoin d'un `!` en attendant la réponse (**TS-03**). L'opérateur `switchMap` relance la recherche quand l'identifiant change dans l'URL (**RX-01**).
- **Singleton pour le service.** Avec `@Injectable({ providedIn: 'root' })`, Angular n'en crée qu'une seule instance pour toute l'application : un seul cache et un seul ordre de tri, quelle que soit la page (**RX-04**, **DATA-05**). Garde-fou : le service n'expose ses données qu'en lecture, pour ne pas devenir une variable globale modifiable de partout.

### 7.3 Rôle des éléments

| Élément | Rôle |
|---|---|
| `DataService` (service) | Charge le JSON à la place des composants (**ARCH-01**), une seule fois grâce au cache (**RX-04**), trie les pays par total décroissant (**DATA-05**), retrouve un pays par son identifiant, calcule les indicateurs et la période couverte par les données (**ARCH-02**) |
| `DashboardPageComponent` (page) | Affiche le texte introductif dont la période vient des données, l'en-tête et les barres, dont le clic ouvre `/country/:id` (**DATA-02**) |
| `CountryDetailPageComponent` (page) | Lit l'identifiant dans l'URL et recharge le pays quand il change (**RX-01**), redirige vers la page not-found sans changer l'URL affichée si l'identifiant est invalide ou inconnu (**DATA-01**), sinon affiche l'en-tête, la courbe et le bouton de retour (**UI-06**) |
| `NotFoundPageComponent` (page) | Affiche le message d'erreur, pour les routes inconnues comme pour les pays introuvables, sans dépasser de l'écran (**UI-04**) |
| `TopBarComponent` (présentation) | Affiche le nom de l'application sur toutes les pages, depuis `AppComponent` |
| `HeaderComponent` (présentation) | Affiche le titre de la page et les indicateurs, chacun avec son libellé et sa valeur, sur les deux pages (**ARCH-03**). Les indicateurs passent à la ligne sur petit écran (**UI-03**) |
| `ChartComponent` (présentation) | Crée le graphique des deux pages (**ARCH-03**), le met à jour, le détruit (**DATA-04**), l'adapte à la largeur disponible (**UI-01**), nomme ses axes sans légende inutile (**UI-05**), le décrit pour les lecteurs d'écran (**A11Y-01**) et signale le clic |
| `PageStatusComponent` (présentation) | Affiche le chargement, l'absence de données ou une erreur (**DATA-03**), avec un lien de retour facultatif |
| `Olympic`, `Participation` (modèles) | Décrivent la forme des données du JSON (**TS-01**) |
| `Indicator`, `ChartItem`, `PageState` (modèles) | Décrivent les données d'affichage et l'état de la page (**DATA-03**). `ChartItem` stocke sa valeur sous forme de nombre (**TS-02**) et porte un identifiant : au clic sur une barre, le graphique renvoie l'identifiant du pays plutôt qu'une position |

**Traités de manière transverse :**
- **A11Y-02** : une palette commune dans `styles/_variables.scss`, contrastée pour le texte comme pour les graphiques ; aucune information ne repose sur la seule couleur.
- **A11Y-03** : `<main>` dans `AppComponent`, un seul `<h1>` par page en tête du contenu, le nom de l'application hors de la hiérarchie des titres.
- **UI-02** : grille de 4, 8 puis 12 colonnes, avec les points de rupture à 768 et 1200 px définis dans `styles/_variables.scss`.

### 7.4 Intégration d'un back-end

- **Seuls `environments/` et `DataService` changent** : l'adresse pointe vers l'API, et la recherche d'un pays passe par une requête dédiée, du type `GET /olympics/:id`.
- **Les modèles servent de contrat** : ils décrivent la forme des réponses attendues.

### 7.5 Correspondance avec le starter

| Starter | Nouvelle architecture | Ce qui change |
|---|---|---|
| `app.module.ts` | `app.config.ts` | Plus de module, seulement les fournisseurs (**ARCH-05**) |
| `app-routing.module.ts` | `app.routes.ts` | Route `country/:id`, ajout de `not-found` |
| `pages/home/` | `pages/dashboard-page/` | Ne garde que l'orchestration |
| `pages/country/` | `pages/country-detail-page/` | Idem, avec la gestion du pays introuvable |
| `pages/not-found/` | `pages/not-found-page/` | Réutilise `PageStatusComponent` |
| Appels HTTP et calculs des pages | `services/data.service.ts` | Centralisés dans le service |
| `any` | `models/*.model.ts` | Interfaces TypeScript |
| Titre `<h2>` « Olympic games app » du dashboard | `components/top-bar/` | Affiché sur toutes les pages, en texte simple |
| Bloc titre et indicateurs dupliqué | `components/header/` | Un composant réutilisable |
| Code Chart.js des pages | `components/chart/` | Un composant réutilisable |
| Styles des pages dans `styles.scss` | `.scss` des composants et `styles/_variables.scss` | Styles rangés avec leur composant |
| `assets/images/teleSport.png` | supprimé | Image jamais affichée |
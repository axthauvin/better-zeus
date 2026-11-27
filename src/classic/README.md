# Ancienne interface — NON MAINTENUE

Ce dossier contient l'interface de Better Zeus **d'avant la refonte de la v3.0**
(commit `6884ccc`), copiée telle quelle. Elle n'existe **que pour la compatibilité** :
certains utilisateurs préfèrent l'ancien look et peuvent y revenir depuis le menu « … »
(« Revenir à l'ancienne interface »). La nouvelle interface reste celle par défaut.

**Règles :**

- **Aucune nouvelle fonctionnalité ici.** Tout le développement se fait dans
  `src/components/` et `src/views/` (la nouvelle interface).
- On ne corrige ici que ce qui casse vraiment (crash, données fausses).
- Le code partagé (`src/api`, `src/utils`, `src/context`, `src/hooks`) ne doit pas
  casser cette interface : si une API change, adapter l'appel ici a minima.
- Ce dossier pourra être supprimé à terme. Pour ça : supprimer `src/classic/`,
  `src/utils/uiVersion.js` et les entrées de bascule dans `AppMenu.jsx` et
  `src/index.jsx`.

Fonctionnement : `src/index.jsx` lit `localStorage["better-zeus-ui"]` et importe
dynamiquement soit `src/modernCalendar.jsx`, soit `src/classic/mount.jsx`, pour que
seul le CSS de l'interface choisie soit injecté. La page de connexion est toujours
celle de la nouvelle interface.

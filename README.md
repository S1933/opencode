# OpenCode — Configuration personnelle

Configuration multi-agents pour [opencode](https://opencode.ai), organisée autour d'un workflow de développement de features en 6 étapes.

## Workflow nominal (nouvelle feature)

```
ask ──► plan ──► build ──► review ──► docs ──► git
 │                 ▲          │
 │                 └──────────┘
 │        (corrections auto si review KO)
 │
 └─ échange + génération du PRD
    (basculer sur un gros modèle : Fable / Opus)
```

1. **`ask`** — échange exploratoire pour cadrer la feature, puis génération d'un **PRD** structuré (workflow PRD intégré au prompt : questions itératives, puis PRD avec goals, user stories, critères d'acceptation, risques). Par défaut sur le small model (`deepseek-v4-flash`) ; l'agent rappelle de basculer sur un gros modèle (Fable, Opus) avant de générer le PRD final.
2. **`plan`** — transforme le PRD en liste de tâches / plan d'implémentation exécutable.
3. **`build`** — implémente le plan avec le plus petit diff sûr.
4. **`review`** — revue du diff par consensus (voir ci-dessous). Si le verdict est *needs revision* ou *rejected*, `review` génère des plans de remédiation via `plan` puis délègue les corrections à **`build`** — la boucle de correction est câblée.
5. **`docs`** — génère la description de la feature : PR description, notes de test, risques, checklist documentation.
6. **`git`** — commit et push de la feature (toutes les commandes destructives ou de publication demandent confirmation).

## Agents

| Agent | Mode | Modèle | Rôle |
|---|---|---|---|
| `ask` | primary (défaut) | `deepseek-v4-flash` | Q&A read-only, exploration, cadrage + génération de PRD. Escalade vers `@build` (implémentation) ou `@plan` (planification). |
| `plan` | primary | `glm-5.2` | Plans d'implémentation structurés et exécutables. Protocole `BLOCKED:` si une info critique manque. |
| `build` | primary | `deepseek-v4-pro` | Implémentation, plus petit diff sûr. Pas de refactoring opportuniste. Protocole `BLOCKED:`. |
| `debug` | primary | `minimax-m3` | Diagnostic de bugs (skill `systematic-debugging`). Isole la cause racine puis handoff vers `plan`. Hors workflow nominal. |
| `review` | primary | `deepseek-v4-pro` | Orchestrateur de revue — ne review pas lui-même. |
| `Salamèche` | subagent | `kimi-k2.7-code` | Revue approfondie : correction, edge cases, sécurité. |
| `Carapuce` | subagent | `glm-5.2` | Revue équilibrée : maintenabilité, régressions. |
| `Bulbizarre` | subagent | `minimax-m3` | Revue rapide : régressions, blockers. |
| `docs` | subagent | `deepseek-v4-flash` | PR description, notes de test, risques, checklist. |
| `git` | primary | `deepseek-v4-flash` | Assistant Git safe (guardrails, résolution de conflits). |

Modèles globaux : `glm-5.2` (défaut), `deepseek-v4-flash` (small model). Agent par défaut : `ask`.

## Revue par consensus

`review` délègue en parallèle à trois reviewers aux profils distincts (Salamèche / Carapuce / Bulbizarre), puis fusionne :

- accords et conflits entre reviewers (avec la position de chacun),
- verdict final : *accepted* / *needs revision* / *rejected*,
- score de confiance (convergence des reviewers),
- action items priorisés,
- pour chaque finding bloquant (critical/high) : plan de remédiation généré par `plan`,
- si le verdict n'est pas *accepted* : délégation des corrections à `build`, puis section « Corrections applied » dans le rapport final.

Les reviewers déterminent la branche de base automatiquement (`develop` → `origin/develop` → `main` → `origin/main`) et couvrent le diff complet : commits de branche, staged, unstaged, untracked visibles.

## Permissions

- Lecture : tout autorisé **sauf** secrets (`.env*`, `*.pem`, `*.key`, `id_rsa*`, `credentials*`, `secrets*`), également bloqués via `cat`/`head`/`tail`/`grep`/`rg`.
- Édition : `ask`, `plan`, `review` et les reviewers en `deny` ; `build`, `debug`, `git` en `ask`.
- Bash : lecture git et commandes read-only en `allow`, tout le reste en `ask`. Côté `git`, toutes les opérations mutantes (commit, push, rebase, reset, etc.) demandent confirmation.
- Délégation (`task`) verrouillée par agent : `ask` → `build`/`plan` uniquement ; `review` → ses 3 reviewers + `plan` + `build` ; les autres n'en ont pas.

## Divers

- **Compaction** : auto, avec prune et préservation des 20k tokens récents.
- **Plugins** : `@streetturtle/opencode-recap` (tui.json), `plugins/sound.js`, `plugins/with-claude-plugin.mjs`.
- **Partage** : désactivé (`share: disabled`).

## Écarts connus vs workflow cible

- `ask` tourne sur le small model par défaut — le passage sur un gros modèle (Fable/Opus) pour la génération du PRD final reste un switch manuel en session (l'agent le rappelle avant de générer).

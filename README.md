# OpenCode — Configuration personnelle

Configuration multi-agents pour [opencode](https://opencode.ai), alignée sur la stack d'agents Claude Code (`~/.claude/agents` + `~/.claude/skills`). Les prompts d'agents vivent dans `prompts/*.md` (référencés via `{file:...}` depuis `opencode.json`), les commandes globales dans `command/*.md` — même structure que côté Claude.

## Workflow nominal (nouvelle feature)

```
ask ──► /to-prd ──► plan ──► build ──► review ──► /pr-describe ──► git
                                  ▲          │
                                  └──────────┘
                        (corrections auto si review KO)

/orchestrator = la chaîne complète orchestrée automatiquement
```

1. **`ask`** — échange exploratoire read-only pour cadrer. Redirige dès que la demande dépasse la conversation : livrable écrit → commande dédiée (`/to-prd`, `/to-adr`, `/issue-draft`, `/write-doc`, `/pr-describe`), découpage → `@plan`, code → `@build`.
2. **`/to-prd`** — transforme l'idée discutée en **PRD** structuré, ancré dans le code réel, écrit dans `docs/prd/<slug>.md`.
3. **`plan`** — lit le PRD/ADR comme source de vérité et produit un plan d'implémentation exécutable.
4. **`build`** — implémente le plan avec le plus petit diff sûr. Si la vérification échoue de façon non évidente : détour `@debug` recommandé plutôt qu'un fix au jugé.
5. **`review`** — revue du diff par consensus (voir ci-dessous). Boucle de correction câblée via `plan` + `build`.
6. **`/pr-describe`** — PR description, notes de test, risques, checklist.
7. **`git`** — commit et push. Gate de sécurité : pas de préparation de push sans verdict de review `accepted` (sauf changements triviaux). Toutes les commandes destructives ou de publication demandent confirmation.

## Commandes

| Commande | Agent | Rôle |
|---|---|---|
| `/orchestrator <feature>` | `orchestrator` | Chaîne complète plan → build → verify → review → `/pr-describe` → git. Critères de sortie : (A) vérifications du projet toutes vertes (comptage dur) et (B) verdict review `accepted`. Cap à 3 itérations build ↔ (verify + review) ; détour `debug` si une vérif échoue de façon non évidente. Jamais auto-validé par build. |
| `/to-prd <idée>` | `build` | Génération d'un PRD structuré. |
| `/pr-describe` | `build` | Description de PR depuis le diff courant. |
| `/to-adr <décision>` | `build` | ADR depuis une décision technique. |
| `/write-doc <demande>` | `build` | Documentation ciblée basée sur le code réel. |
| `/issue-draft <contexte>` | `ask` | Brouillon d'issue prêt à coller. |
| `/review-diff` | `review` | Revue par consensus du diff courant. |

## Agents

| Agent | Mode | Modèle | Rôle |
|---|---|---|---|
| `ask` | primary (défaut) | `deepseek-v4-pro` | Q&A read-only, exploration. Redirige vers commandes custom / `@plan` / `@build`. |
| `plan` | primary | `glm-5.2` | Plans exécutables ancrés PRD/code. Mode « review fixation » pour les findings bloquants. Protocole `BLOCKED:`. |
| `build` | primary | `deepseek-v4-pro` | Implémentation, plus petit diff sûr, pas de refactoring opportuniste. Skill TDD. Protocole `BLOCKED:`. |
| `debug` | primary | `minimax-m3` | Diagnostic (skill `systematic-debugging`). Reproduction autonome préférée ; boucle de preuves utilisateur en fallback. Handoff vers `@plan`. |
| `review` | primary | `deepseek-v4-pro` | Orchestrateur de revue — ne review pas lui-même. Mode « verdict + findings only » quand appelé par `orchestrator`. |
| `Salamèche` | subagent | `kimi-k2.7-code` | Revue approfondie : correction, edge cases, sécurité. |
| `Carapuce` | subagent | `glm-5.2` | Revue équilibrée : maintenabilité, régressions. |
| `Bulbizarre` | subagent | `minimax-m3` | Revue rapide : régressions, blockers. |
| `git` | primary | `deepseek-v4-pro` | Assistant Git safe (skill `resolving-merge-conflicts`, gate review avant push). |
| `orchestrator` | primary | `glm-5.2` | Orchestrateur de livraison (`/orchestrator`). Délègue tout, ne code rien, tranche via les évaluateurs. |

Modèles globaux : `glm-5.2` (défaut), `deepseek-v4-flash` (small model). Agent par défaut : `ask`.

Correspondance avec la stack Claude : opus → `glm-5.2`, sonnet → `deepseek-v4-pro`. `deepseek-v4-flash` reste le small model global (tâches internes d'opencode : titres, résumés), plus aucun agent ne tourne dessus.

## Revue par consensus

`review` délègue en parallèle à trois reviewers aux profils distincts (Salamèche / Carapuce / Bulbizarre), puis fusionne :

- accords et conflits entre reviewers (avec la position de chacun),
- verdict final : *accepted* / *needs revision* / *rejected*,
- score de confiance (convergence des reviewers),
- action items priorisés,
- pour chaque finding bloquant (critical/high) : plan de remédiation généré par `plan`,
- si le verdict n'est pas *accepted* : délégation des corrections à `build`, puis section « Corrections applied » dans le rapport final.

Quand `review` est appelé par `orchestrator`, il rend uniquement verdict + findings : la boucle de correction appartient à l'orchestrateur.

Les reviewers déterminent la branche de base automatiquement (`develop` → `origin/develop` → `main` → `origin/main`) et couvrent le diff complet : commits de branche, staged, unstaged, untracked visibles.

## Skills

Les prompts référencent les skills partagées de `~/.agents/skills` (exposées via le plugin `opencode-with-claude`) : `caveman`, `test-driven-development`, `systematic-debugging`, `resolving-merge-conflicts`, `verification-before-completion`.

## Permissions

- Lecture : tout autorisé **sauf** secrets (`.env*`, `*.pem`, `*.key`, `id_rsa*`, `credentials*`, `secrets*`), également bloqués via `cat`/`head`/`tail`/`grep`/`rg`.
- Édition : `ask`, `plan`, `review`, `orchestrator` et les reviewers en `deny` ; `build`, `debug`, `git` en `ask`.
- Bash : lecture git et commandes read-only en `allow`, tout le reste en `ask`. Côté `git`, toutes les opérations mutantes (commit, push, rebase, reset, etc.) demandent confirmation.
- Délégation (`task`) verrouillée par agent : `ask` → `build`/`plan`/`debug`/`review`/`git` ; `review` → ses 3 reviewers + `plan` + `build` ; `orchestrator` → `plan`/`build`/`debug`/`review`/`git` ; les autres n'en ont pas.

## Divers

- **Compaction** : auto, avec prune et préservation des 20k tokens récents.
- **Plugins** : `@streetturtle/opencode-recap` (tui.json), `plugins/sound.js` (parité avec les hooks sonores Claude), `plugins/with-claude-plugin.mjs` (pont vers `~/.claude` : skills, etc.).
- **Partage** : désactivé (`share: disabled`).

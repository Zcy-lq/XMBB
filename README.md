# CatBackpackNight Multi-Agent Workflow

This workspace contains the commercial multi-agent workflow for `CatBackpackNight`, a Cocos Creator 3.8.x + TypeScript WeChat mini game.

## Generate Manual Agent Prompts

```powershell
python run_multi_agent.py --manual-prompt-only
```

Useful filters:

```powershell
python run_multi_agent.py --manual-prompt-only --agent PlatformAgent
python run_multi_agent.py --manual-prompt-only --from-agent AssetAgent
```

Manual prompts now reference real project files:

- `CatBackpackNight/agent_handoffs/HANDOFF_<AgentName>.md`
- `CatBackpackNight/agent_reports/REPORT_<AgentName>.md`
- actual docs, configs, and code files

They do not use `Prompt prepared at ...` as fake handoff context.

## Automatic API Runs

Use a concrete model when possible:

```powershell
python run_multi_agent.py --execute-openai --model <model_name> --write-handoffs --validate-after-each-agent
```

`--model strongest-available` is accepted, but this local script cannot always resolve it automatically. If it cannot, set `CODEX_MODEL` or pass a concrete `--model`.

## Validation

Run:

```powershell
cd CatBackpackNight
npm run workflow:check
```

This checks config JSON parsing, asset placeholder paths, handoff/report presence, and build-gate files.

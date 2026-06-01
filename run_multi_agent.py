import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PROMPTS_FILE = ROOT / "cat_game_agents_prompts.json"
OUTPUT_DIR = ROOT / "agent_outputs"
PROJECT_ROOT = ROOT / "CatBackpackNight"
HANDOFF_DIR = PROJECT_ROOT / "agent_handoffs"
REPORT_DIR = PROJECT_ROOT / "agent_reports"


def load_config():
    with PROMPTS_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


def ensure_workflow_dirs():
    OUTPUT_DIR.mkdir(exist_ok=True)
    HANDOFF_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)


def agent_sequence(config, agent_name=None, from_agent=None):
    order = config["execution_order"]
    agents_by_name = {agent["name"]: agent for agent in config["agents"]}

    if agent_name and from_agent:
        raise SystemExit("--agent and --from-agent cannot be used together.")

    if agent_name:
        if agent_name not in agents_by_name:
            raise SystemExit(f"Unknown agent: {agent_name}")
        return [agents_by_name[agent_name]]

    if from_agent:
        if from_agent not in agents_by_name:
            raise SystemExit(f"Unknown --from-agent: {from_agent}")
        start = order.index(from_agent)
        order = order[start:]

    return [agents_by_name[name] for name in order]


def previous_agent_paths(config, current_agent_name):
    order = config["execution_order"]
    current_index = order.index(current_agent_name)
    paths = []
    for name in order[:current_index]:
        paths.extend(
            [
                HANDOFF_DIR / f"HANDOFF_{name}.md",
                REPORT_DIR / f"REPORT_{name}.md",
                HANDOFF_DIR / f"AUTO_OUTPUT_{name}.md",
            ]
        )
    return paths


def format_paths(paths):
    if not paths:
        return "- No previous agent handoffs are required for this agent."
    formatted = []
    for path in paths:
        try:
            display_path = path.relative_to(ROOT)
        except ValueError:
            display_path = path
        formatted.append(f"- {display_path.as_posix()}")
    return "\n".join(formatted)


def build_agent_prompt(config, agent):
    project = config["project"]
    model_policy = config.get("model_policy", {})
    required_checks = agent.get("required_checks", config.get("default_required_checks", []))
    stop_conditions = agent.get("stop_conditions", config.get("stop_conditions", []))
    previous_paths = previous_agent_paths(config, agent["name"])
    documentation_policy = project.get("documentation_policy", [])

    return f"""# Project
Name: {project["name"]}
Platform: {project["platform"]}
Engine: {project["engine"]}
Output root: {project["output_root"]}

# Agent Identity
Name: {agent["name"]}
Role: {agent["role"]}
Recommended model: {agent.get("recommended_model", model_policy.get("default_best", "strongest-available"))}
Model guidance: {model_policy.get("principle", "Use the strongest available Codex reasoning/coding model.")}

# Commercial Quality Bar
This is a commercial-grade WeChat mini game, not a demo.
The agent must create or modify real project files.
The agent must not fake access to missing files.
The agent must produce a handoff file and a report file.
The agent must mark every unverified Cocos Editor, WeChat DevTools, or real-device claim as UNVERIFIED.

# Efficiency And Documentation Policy
{chr(10).join("- " + item for item in documentation_policy)}

# Required Inputs
{chr(10).join("- " + item for item in agent.get("input", []))}

# Previous Agent Handoffs
Please read these files if they exist:
{format_paths(previous_paths)}

If they do not exist:
- mark them as MISSING in your handoff
- do not assume their contents
- create blockers or safe placeholders
- do not use prompt files as evidence of completed work

# Fallback Behavior
{chr(10).join("- " + item for item in agent.get("fallback_behavior", []))}

# Allowed Changes
{chr(10).join("- " + item for item in agent.get("allowed_changes", []))}

# Forbidden Changes
{chr(10).join("- " + item for item in agent.get("forbidden_changes", []))}

# Required Outputs
{chr(10).join("- " + item for item in agent.get("output", []))}
- CatBackpackNight/agent_handoffs/HANDOFF_{agent["name"]}.md
- CatBackpackNight/agent_reports/REPORT_{agent["name"]}.md

# Required Checks
{chr(10).join("- " + item for item in required_checks)}

# Acceptance Criteria
{chr(10).join("- " + item for item in agent.get("acceptance_criteria", []))}

# Stop Conditions
{chr(10).join("- " + item for item in stop_conditions)}

# Task
{agent["prompt"]}

# Handoff Requirements
Create CatBackpackNight/agent_handoffs/HANDOFF_{agent["name"]}.md with:
1. Agent Identity
2. Inputs Actually Read
3. Files Created
4. Files Modified
5. Key Decisions
6. Public Contracts For Later Agents
7. Validation Performed
8. Known Risks
9. Remaining TODOs
10. Next Agent Instructions

Create CatBackpackNight/agent_reports/REPORT_{agent["name"]}.md with:
1. Summary
2. Acceptance Criteria Result
3. Commands Run
4. Blockers
5. Low-risk Fixes Applied
6. Needs Human Confirmation
7. Recommended Next Step

# Final Response Format
End with:
{agent["name"]} Handoff
- Files changed:
- What works now:
- Remaining TODOs:
- Blockers:
"""


def write_prompt_files(config, selected_agents):
    ensure_workflow_dirs()
    for old_prompt in OUTPUT_DIR.glob("*.prompt.md"):
        old_prompt.unlink()
    for agent in selected_agents:
        prompt = build_agent_prompt(config, agent)
        path = OUTPUT_DIR / f"{agent['name']}.prompt.md"
        path.write_text(prompt, encoding="utf-8")
        print(f"prepared: {path}")


def resolve_model(model):
    if model != "strongest-available":
        return model
    env_model = os.getenv("CODEX_MODEL") or os.getenv("OPENAI_MODEL")
    if env_model:
        return env_model
    raise SystemExit(
        "Model 'strongest-available' cannot be resolved automatically in this "
        "environment. Re-run with --model <model_name>, or set CODEX_MODEL. "
        "Example: python run_multi_agent.py --execute-openai --model gpt-5.5"
    )


def run_required_checks():
    if not PROJECT_ROOT.exists():
        return 1
    commands = [
        ["node", "tools/validate_configs.js"],
        ["node", "tools/validate_assets.js"],
        ["node", "tools/audit_design_reference.mjs"],
        ["node", "tools/validate_handoffs.js", "--allow-missing"],
        ["node", "tools/build_check.js"],
    ]
    for command in commands:
        result = subprocess.run(command, cwd=PROJECT_ROOT, text=True)
        if result.returncode != 0:
            return result.returncode
    return 0


def blocker_detected():
    for path in [
        PROJECT_ROOT / "docs" / "BLOCKERS.md",
        PROJECT_ROOT / "docs" / "QA_BLOCKERS.md",
    ]:
        if path.exists() and p0_blocker_entries(path.read_text(encoding="utf-8", errors="ignore")):
            return True
    return False


def p0_blocker_entries(text):
    entries = []
    in_p0_section = False
    for raw_line in text.splitlines():
        line = raw_line.strip()
        lower = line.lower()

        if line.startswith("## "):
            in_p0_section = "p0" in lower
            continue

        if not in_p0_section or not line or line.startswith("#"):
            continue

        if lower.startswith("- none") or lower in {"none", "n/a", "no active p0 blocker"}:
            continue

        if line.startswith("-") or lower.startswith("issue:"):
            entries.append(line)

    return entries


def write_auto_output(agent_name, text):
    ensure_workflow_dirs()
    path = HANDOFF_DIR / f"AUTO_OUTPUT_{agent_name}.md"
    timestamp = datetime.now().isoformat(timespec="seconds")
    path.write_text(
        f"# AUTO_OUTPUT_{agent_name}\n\nRun date: {timestamp}\n\n{text}\n",
        encoding="utf-8",
    )
    return path


def run_with_openai(config, selected_agents, model, write_handoffs, validate_after_each, stop_on_blocker):
    resolved_model = resolve_model(model)

    try:
        from openai import OpenAI
    except ImportError as exc:
        raise SystemExit("Missing dependency. Run: pip install openai") from exc

    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY is not set.")

    ensure_workflow_dirs()
    client = OpenAI()

    for agent in selected_agents:
        if stop_on_blocker and blocker_detected():
            raise SystemExit("P0 blocker detected. Stop-on-blocker is enabled.")

        prompt = build_agent_prompt(config, agent)
        print(f"\n=== Running {agent['name']} with {resolved_model} ===")
        response = client.responses.create(
            model=resolved_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        f"You are {agent['name']}, {agent['role']}. "
                        "You are working in a local code project. "
                        "Return concrete file changes, validation evidence, "
                        "handoff content, and report content."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        )

        text = response.output_text
        out_path = OUTPUT_DIR / f"{agent['name']}.output.md"
        out_path.write_text(text, encoding="utf-8")
        print(f"saved: {out_path}")

        if write_handoffs:
            auto_path = write_auto_output(agent["name"], text)
            print(f"saved: {auto_path}")

        if validate_after_each:
            exit_code = run_required_checks()
            if exit_code != 0:
                raise SystemExit(f"Validation failed after {agent['name']}: {exit_code}")


def main():
    parser = argparse.ArgumentParser(
        description="Prepare or run the commercial multi-agent workflow for the WeChat mini game."
    )
    parser.add_argument("--execute-openai", action="store_true", help="Call the OpenAI API.")
    parser.add_argument("--manual-prompt-only", action="store_true", help="Only generate prompt files.")
    parser.add_argument("--write-handoffs", action="store_true", help="Write API outputs to agent_handoffs/AUTO_OUTPUT_<AgentName>.md.")
    parser.add_argument("--validate-after-each-agent", action="store_true", help="Run workflow validation after each API-run agent.")
    parser.add_argument("--stop-on-blocker", action="store_true", help="Stop if docs/BLOCKERS.md or docs/QA_BLOCKERS.md contains a P0 blocker.")
    parser.add_argument("--agent", help="Generate or run only one agent by name.")
    parser.add_argument("--from-agent", help="Generate or run from this agent through the end.")
    parser.add_argument(
        "--model",
        default=os.getenv("CODEX_MODEL", "strongest-available"),
        help="Model used with --execute-openai. Use a concrete model or strongest-available.",
    )
    args = parser.parse_args()

    if args.execute_openai and args.manual_prompt_only:
        raise SystemExit("--execute-openai and --manual-prompt-only cannot be combined.")

    config = load_config()
    selected_agents = agent_sequence(config, args.agent, args.from_agent)

    if args.execute_openai:
        run_with_openai(
            config,
            selected_agents,
            args.model,
            args.write_handoffs,
            args.validate_after_each_agent,
            args.stop_on_blocker,
        )
    else:
        write_prompt_files(config, selected_agents)
        print("\nManual prompt generation complete.")
        print("Open the prompt files in agent_outputs/ and run them with Codex.")
        print("Each prompt now references real handoff/report/project paths and must mark missing inputs.")
        print("To call the OpenAI API directly, set OPENAI_API_KEY and run:")
        print("python run_multi_agent.py --execute-openai --model <model_name>")


if __name__ == "__main__":
    try:
        main()
    except SystemExit as exc:
        if isinstance(exc.code, str):
            print(exc.code, file=sys.stderr)
            sys.exit(1)
        raise

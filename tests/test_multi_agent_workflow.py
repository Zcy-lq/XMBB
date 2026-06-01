import shutil
import subprocess
import sys
import unittest
from unittest.mock import patch
from pathlib import Path
from tempfile import TemporaryDirectory

import run_multi_agent


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "agent_outputs"


class MultiAgentWorkflowTests(unittest.TestCase):
    def setUp(self):
        self._backup_dir = ROOT / "_test_agent_outputs_backup"
        if self._backup_dir.exists():
            shutil.rmtree(self._backup_dir)
        if OUTPUT_DIR.exists():
            shutil.copytree(OUTPUT_DIR, self._backup_dir)

    def tearDown(self):
        if OUTPUT_DIR.exists():
            shutil.rmtree(OUTPUT_DIR)
        if self._backup_dir.exists():
            shutil.move(str(self._backup_dir), str(OUTPUT_DIR))

    def run_script(self, *args):
        return subprocess.run(
            [sys.executable, str(ROOT / "run_multi_agent.py"), *args],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def test_manual_prompts_reference_real_handoff_files(self):
        result = self.run_script("--manual-prompt-only")

        self.assertEqual(result.returncode, 0, result.stderr)
        qa_prompt = (OUTPUT_DIR / "QAReleaseAgent.prompt.md").read_text(
            encoding="utf-8"
        )
        self.assertIn(
            "CatBackpackNight/agent_handoffs/HANDOFF_ProductAgent.md",
            qa_prompt,
        )
        self.assertIn(
            "CatBackpackNight/agent_reports/REPORT_ProductAgent.md",
            qa_prompt,
        )
        self.assertIn("mark them as MISSING", qa_prompt)
        self.assertNotIn("Prompt prepared at", qa_prompt)

    def test_agent_filter_generates_only_requested_prompt(self):
        result = self.run_script("--manual-prompt-only", "--agent", "PlatformAgent")

        self.assertEqual(result.returncode, 0, result.stderr)
        prompts = sorted(path.name for path in OUTPUT_DIR.glob("*.prompt.md"))
        self.assertEqual(prompts, ["PlatformAgent.prompt.md"])

    def test_strongest_available_model_does_not_hardcode_default_api_model(self):
        result = self.run_script(
            "--execute-openai",
            "--model",
            "strongest-available",
            "--agent",
            "ProductAgent",
        )

        self.assertNotEqual(result.returncode, 0)
        combined = result.stdout + result.stderr
        self.assertIn("--model", combined)
        self.assertIn("strongest-available", combined)

    def test_empty_p0_blocker_heading_is_not_detected_as_blocker(self):
        with TemporaryDirectory() as temp_dir:
            project_root = Path(temp_dir) / "CatBackpackNight"
            docs_dir = project_root / "docs"
            docs_dir.mkdir(parents=True)
            (docs_dir / "QA_BLOCKERS.md").write_text(
                "# QA_BLOCKERS\n\n"
                "## P0 Blockers\n\n"
                "- None currently recorded by this protocol update.\n",
                encoding="utf-8",
            )

            with patch.object(run_multi_agent, "PROJECT_ROOT", project_root):
                self.assertFalse(run_multi_agent.blocker_detected())

    def test_p0_blocker_entry_is_detected(self):
        with TemporaryDirectory() as temp_dir:
            project_root = Path(temp_dir) / "CatBackpackNight"
            docs_dir = project_root / "docs"
            docs_dir.mkdir(parents=True)
            (docs_dir / "QA_BLOCKERS.md").write_text(
                "# QA_BLOCKERS\n\n"
                "## P0 Blockers\n\n"
                "- Issue: P0 runtime asset missing from production bundle.\n"
                "- Evidence: verify:runtime-assets failed.\n",
                encoding="utf-8",
            )

            with patch.object(run_multi_agent, "PROJECT_ROOT", project_root):
                self.assertTrue(run_multi_agent.blocker_detected())

    def test_required_validation_tools_run(self):
        commands = [
            ["node", "tools/validate_configs.js"],
            ["node", "tools/validate_assets.js"],
            ["node", "tools/validate_handoffs.js", "--allow-missing"],
            ["node", "tools/build_check.js"],
        ]

        for command in commands:
            with self.subTest(command=" ".join(command)):
                result = subprocess.run(
                    command,
                    cwd=ROOT / "CatBackpackNight",
                    text=True,
                    capture_output=True,
                    check=False,
                )
                self.assertEqual(result.returncode, 0, result.stderr + result.stdout)


if __name__ == "__main__":
    unittest.main()

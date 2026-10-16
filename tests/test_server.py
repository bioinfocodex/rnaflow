"""Tests for rnaflow_server.py — the parts that decide what may run.

    python3 -m unittest discover tests
"""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import rnaflow_server as srv  # noqa: E402

GOOD = """# RNAflow pinned environment, release 2026.10
name: rnaseq
channels:
  - conda-forge
  - bioconda
dependencies:
  - fastqc=0.13.0
  - r-rcolorbrewer=1.1_3
"""


class SetupValidation(unittest.TestCase):
    def test_accepts_a_pinned_rnaflow_environment(self):
        self.assertIsNone(srv.validate_env_yaml(GOOD))

    def test_rejects_anything_that_could_reach_a_shell(self):
        bad = GOOD.replace("fastqc=0.13.0", "fastqc=0.13.0; rm -rf ~")
        self.assertIn("unexpected line", srv.validate_env_yaml(bad))

    def test_rejects_unpinned_packages(self):
        self.assertIn("unexpected line", srv.validate_env_yaml(GOOD.replace("fastqc=0.13.0", "fastqc")))

    def test_rejects_other_channels_and_pip(self):
        self.assertIsNotNone(srv.validate_env_yaml(GOOD.replace("  - bioconda", "  - some-channel")))
        self.assertIsNotNone(srv.validate_env_yaml(GOOD + "  - pip:\n    - requests\n"))

    def test_rejects_another_environment_name(self):
        self.assertIn("must be named", srv.validate_env_yaml(GOOD.replace("name: rnaseq", "name: base")))

    def test_rejects_empty_and_huge(self):
        self.assertIsNotNone(srv.validate_env_yaml(""))
        self.assertIsNotNone(srv.validate_env_yaml(GOOD + "# x\n" * 6000))


@unittest.skipIf(srv.IS_WIN, "POSIX shell wrapper")
class CommandWrapper(unittest.TestCase):
    def test_jobs_activate_the_environment(self):
        args = srv.build_command("echo hi")
        self.assertIn(f"conda activate {srv.CONDA_ENV}", args[-1])
        self.assertTrue(args[-1].endswith("echo hi"))

    def test_setup_does_not_activate_the_env_it_is_creating(self):
        args = srv.build_command("echo hi", activate=False)
        self.assertNotIn("conda activate", args[-1])
        self.assertTrue(args[-1].endswith("echo hi"))

    def test_private_conda_is_searched_first(self):
        args = srv.build_command("true")
        private = os.path.join(srv.PRIVATE_CONDA, "etc", "profile.d", "conda.sh")
        if os.path.isfile(private):
            self.assertTrue(args[-1].startswith(f'. "{private}"'))


class FileScope(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp(dir=srv.HOME, prefix="rnaflow-test-")
        open(os.path.join(self.dir, "a.csv"), "w").close()
        root, err = srv.add_scope(self.dir)
        self.assertIsNone(err)
        self.root = root

    def tearDown(self):
        with srv.scope_lock:
            srv.scopes.discard(self.root) if hasattr(srv.scopes, "discard") else None
        os.remove(os.path.join(self.dir, "a.csv"))
        os.rmdir(self.dir)

    def test_serves_files_inside_the_project(self):
        real, err = srv.resolve_in_scope(os.path.join(self.dir, "a.csv"))
        self.assertIsNone(err)

    def test_refuses_traversal_out_of_the_project(self):
        _, err = srv.resolve_in_scope(os.path.join(self.dir, "..", ".ssh", "id_rsa"))
        self.assertIsNotNone(err)

    def test_refuses_folders_outside_home(self):
        _, err = srv.add_scope("/etc")
        self.assertIsNotNone(err)


if __name__ == "__main__":
    unittest.main()

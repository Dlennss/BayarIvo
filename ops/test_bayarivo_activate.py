import hashlib
import importlib.util
import os
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("activate", Path(__file__).with_name("bayarivo-activate.py"))
activate = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(activate)
COMMIT = "a" * 40
RELEASE = "ci-" + COMMIT + "-123-1"


@unittest.skipIf(os.name == "nt", "Run deployment tests on Linux: Unix symlinks are required")
class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.patch = patch.object(activate, "BASE", self.base)
        self.patch.start()
        self.addCleanup(self.patch.stop)
        self.old = self.base / "releases/previous"
        self.old.mkdir(parents=True)
        (self.base / "current").symlink_to(self.old, target_is_directory=True)
        self.payload = self.base / "payload"
        for name, value in {
            "frontend/server.js": "server",
            "frontend/.next/BUILD_ID": "build",
            "frontend/.next/static/chunk.js": "chunk",
            "frontend/DEPLOY_COMMIT": COMMIT,
            "frontend/public/deploy-version.txt": COMMIT,
        }.items():
            target = self.payload / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(value)
        header = bytearray(20)
        header[:6] = b"\x7fELF\x02\x01"
        header[18:20] = b"\x3e\x00"
        (self.payload / "backend").mkdir()
        (self.payload / "backend/bayarivo-api").write_bytes(header)
        (self.base / "shared").mkdir()
        (self.base / "shared/backend.env").write_text("preserve-production-config")

    def bundle(self):
        stage = self.base / "incoming" / RELEASE
        stage.mkdir(parents=True)
        archive = stage / "release.tar.gz"
        with tarfile.open(archive, "w:gz") as bundle:
            for name in ("backend", "frontend"):
                bundle.add(self.payload / name, arcname=name)
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        (stage / "release.tar.gz.sha256").write_text(digest + "  release.tar.gz\n")
        return stage

    def assert_unchanged(self):
        self.assertEqual((self.base / "current").resolve(), self.old)
        self.assertEqual((self.base / "shared/backend.env").read_text(), "preserve-production-config")

    def test_valid_archive_preserves_hidden_next_files(self):
        self.bundle()
        release, commit = activate.unpack(RELEASE)
        self.assertEqual(commit, COMMIT)
        self.assertTrue((release / "frontend/.next/static/chunk.js").is_file())
        self.assertTrue((release / "bayarivo-api").is_file())
        self.assert_unchanged()

    def test_rejects_invalid_release_id(self):
        with self.assertRaises(ValueError):
            activate.unpack("not-a-release")
        self.assert_unchanged()

    def test_rejects_corrupt_upload(self):
        stage = self.bundle()
        with (stage / "release.tar.gz").open("ab") as file:
            file.write(b"corrupt")
        with self.assertRaisesRegex(RuntimeError, "checksum mismatch"):
            activate.unpack(RELEASE)
        self.assert_unchanged()

    def test_rejects_arm_binary(self):
        binary = self.payload / "backend/bayarivo-api"
        header = bytearray(binary.read_bytes())
        header[18:20] = b"\xb7\x00"
        binary.write_bytes(header)
        self.bundle()
        with self.assertRaisesRegex(RuntimeError, "AMD64"):
            activate.unpack(RELEASE)
        self.assert_unchanged()

    def test_rejects_wrong_commit(self):
        (self.payload / "frontend/public/deploy-version.txt").write_text("b" * 40)
        self.bundle()
        with self.assertRaisesRegex(RuntimeError, "commit marker"):
            activate.unpack(RELEASE)
        self.assert_unchanged()

    def test_rejects_environment_file(self):
        (self.payload / "frontend/.env").write_text("must-not-be-deployed")
        self.bundle()
        with self.assertRaisesRegex(RuntimeError, "Environment files"):
            activate.unpack(RELEASE)
        self.assert_unchanged()

    def test_rejects_escaping_symlink(self):
        (self.payload / "frontend/outside").symlink_to(self.base / "shared")
        self.bundle()
        with self.assertRaises((tarfile.FilterError, RuntimeError)):
            activate.unpack(RELEASE)
        self.assert_unchanged()

    def test_success_switches_only_after_backup(self):
        self.bundle()
        with patch.object(activate, "preflight"), patch.object(activate, "run"), \
             patch.object(activate, "backup_database", side_effect=lambda _: self.assert_unchanged()) as backup, \
             patch.object(activate, "restart"), patch.object(activate, "healthy", return_value=True):
            activate.activate(RELEASE)
        backup.assert_called_once_with(RELEASE)
        self.assertEqual((self.base / "current").resolve(), self.base / "releases" / RELEASE)
        self.assertEqual((self.base / "shared/backend.env").read_text(), "preserve-production-config")

    def test_health_failure_rolls_back(self):
        self.bundle()
        with patch.object(activate, "preflight"), patch.object(activate, "run"), \
             patch.object(activate, "backup_database"), patch.object(activate, "restart") as restart, \
             patch.object(activate, "healthy", side_effect=[False, True]):
            with self.assertRaisesRegex(RuntimeError, "previous release restored"):
                activate.activate(RELEASE)
        self.assertEqual(restart.call_count, 2)
        self.assert_unchanged()

    def test_backup_failure_does_not_switch(self):
        self.bundle()
        with patch.object(activate, "preflight"), patch.object(activate, "run"), \
             patch.object(activate, "backup_database", side_effect=RuntimeError("backup failed")):
            with self.assertRaisesRegex(RuntimeError, "backup failed"):
                activate.activate(RELEASE)
        self.assert_unchanged()

    def test_restart_failure_rolls_back(self):
        self.bundle()
        with patch.object(activate, "preflight"), patch.object(activate, "run"), \
             patch.object(activate, "backup_database"), \
             patch.object(activate, "restart", side_effect=[RuntimeError("restart failed"), None]), \
             patch.object(activate, "healthy", return_value=True):
            with self.assertRaisesRegex(RuntimeError, "previous release restored"):
                activate.activate(RELEASE)
        self.assert_unchanged()

    def test_rollback_failure_is_reported(self):
        self.bundle()
        with patch.object(activate, "preflight"), patch.object(activate, "run"), \
             patch.object(activate, "backup_database"), patch.object(activate, "restart"), \
             patch.object(activate, "healthy", return_value=False):
            with self.assertRaisesRegex(RuntimeError, "rollback health checks failed"):
                activate.activate(RELEASE)
        self.assert_unchanged()

    def test_health_checks_catalog_and_exact_revision(self):
        with patch.object(activate, "run"), \
             patch.object(activate, "fetch", side_effect=["OK", '{"ok":true,"items":[]}', "catalog", COMMIT]):
            self.assertTrue(activate.healthy(COMMIT))

    def test_health_rejects_wrong_revision(self):
        with patch.object(activate, "run"), \
             patch.object(activate, "fetch", side_effect=["OK", '{"ok":true,"items":[]}', "catalog", "wrong"]), \
             patch.object(activate.time, "monotonic", side_effect=[0, 0, 121]), \
             patch.object(activate.time, "sleep"):
            self.assertFalse(activate.healthy(COMMIT))


if __name__ == "__main__":
    unittest.main()

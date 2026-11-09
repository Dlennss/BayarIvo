#!/usr/bin/python3
"""Deploy immutable AMD64 releases on the new server without changing production data."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import platform
import re
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.request

BASE = Path("/home/mitra-p24/hit/Bayarivo")
RELEASE_ID = re.compile(r"ci-([0-9a-f]{40})-[0-9]+-[0-9]+")
UNITS = ("bayarivo-be.service", "bayarivo-fe.service")


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def fetch(url):
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(url, timeout=10) as response:
        return response.read().decode()


def preflight():
    if os.geteuid() != 0 or platform.machine() != "x86_64":
        raise RuntimeError("Activation requires root on the x86_64 server")
    node = subprocess.check_output(["/usr/local/bin/node", "--version"], text=True).strip()
    if not node.startswith("v24."):
        raise RuntimeError("Node.js 24 is required")
    for name in ("backend.env", "frontend.env"):
        path = BASE / "shared" / name
        if not path.is_file() or path.is_symlink():
            raise RuntimeError("Missing server-owned configuration: " + name)
    current = BASE / "current"
    if not current.is_symlink() or current.resolve().parent != (BASE / "releases").resolve():
        raise RuntimeError("current must point to an existing Bayarivo release")
    if not (current / "frontend/server.js").is_file() or not (current / "bayarivo-api").is_file():
        raise RuntimeError("Current release is incomplete")
    for unit in UNITS:
        command = subprocess.check_output(["systemctl", "show", unit, "-p", "ExecStart", "--value"], text=True)
        directory = subprocess.check_output(["systemctl", "show", unit, "-p", "WorkingDirectory", "--value"], text=True).strip()
        expected = str(current / "bayarivo-api") if unit == UNITS[0] else "/usr/local/bin/node"
        expected_dir = str(BASE / "shared") if unit == UNITS[0] else str(current / "frontend")
        if expected not in command or directory != expected_dir:
            raise RuntimeError("Unexpected service configuration: " + unit)
    run("systemctl", "is-active", "--quiet", *UNITS)


def validate_tree(release, commit):
    for entry in release.rglob("*"):
        if entry.name == ".env" or entry.name.startswith(".env."):
            raise RuntimeError("Environment files must stay outside release artifacts")
        if entry.is_symlink() and not entry.resolve().is_relative_to(release.resolve()):
            raise RuntimeError("Release symlink escapes its directory")
    frontend = release / "frontend"
    for name in ("server.js", ".next/BUILD_ID", "DEPLOY_COMMIT", "public/deploy-version.txt"):
        if not (frontend / name).is_file():
            raise RuntimeError("Incomplete frontend: " + name)
    if not (frontend / ".next/static").is_dir():
        raise RuntimeError("Missing Next.js static assets")
    for name in ("DEPLOY_COMMIT", "public/deploy-version.txt"):
        if (frontend / name).read_text().strip() != commit:
            raise RuntimeError("Frontend commit marker does not match requested release")
    with (release / "backend/bayarivo-api").open("rb") as binary:
        header = binary.read(20)
    if len(header) != 20 or header[:6] != b"\x7fELF\x02\x01" or header[18:20] != b"\x3e\x00":
        raise RuntimeError("Backend must be Linux AMD64")


def unpack(release_id):
    match = RELEASE_ID.fullmatch(release_id)
    if not match:
        raise ValueError("Invalid release ID")
    stage = BASE / "incoming" / release_id
    if stage.is_symlink() or stage.resolve().parent != (BASE / "incoming").resolve():
        raise RuntimeError("Invalid staging directory")
    archive = stage / "release.tar.gz"
    if archive.is_symlink():
        raise RuntimeError("Archive must be a regular staging file")
    checksum = (stage / "release.tar.gz.sha256").read_text().split()
    if len(checksum) != 2 or not re.fullmatch(r"[0-9a-f]{64}", checksum[0]) or checksum[1] != "release.tar.gz":
        raise RuntimeError("Invalid archive checksum manifest")
    with archive.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    if digest != checksum[0]:
        raise RuntimeError("Archive checksum mismatch")
    release = BASE / "releases" / release_id
    release.mkdir(mode=0o755, exist_ok=False)
    with tarfile.open(archive, "r:gz") as bundle:
        for member in bundle.getmembers():
            parts = PurePosixPath(member.name).parts
            if not parts or parts[0] not in ("frontend", "backend") or ".." in parts:
                raise RuntimeError("Unexpected archive path")
        bundle.extractall(release, filter="data")
    validate_tree(release, match[1])
    shutil.move(release / "backend/bayarivo-api", release / "bayarivo-api")
    os.chmod(release / "bayarivo-api", 0o755)
    return release, match[1]


def backup_database(release_id):
    backup_dir = BASE / "backups"
    backup_dir.mkdir(mode=0o700, exist_ok=True)
    path = backup_dir / (release_id + ".dump")
    with path.open("xb") as output:
        os.chmod(path, 0o600)
        try:
            run("runuser", "-u", "bayarivo", "--", "pg_dump", "-Fc", "bayarivo", stdout=output, timeout=120)
        except Exception:
            path.unlink(missing_ok=True)
            raise
    if path.stat().st_size == 0:
        raise RuntimeError("Database backup is empty")


def switch_current(target):
    temporary = BASE / ("current.next-" + str(os.getpid()) + "-" + str(time.time_ns()))
    temporary.symlink_to(target)
    os.replace(temporary, BASE / "current")


def restart():
    for unit in UNITS:
        run("systemctl", "restart", unit, timeout=90)


def healthy(commit=None):
    deadline = time.monotonic() + 120
    while time.monotonic() < deadline:
        try:
            run("systemctl", "is-active", "--quiet", *UNITS, stdout=subprocess.DEVNULL, timeout=10)
            fetch("http://127.0.0.1:8104/health")
            catalog = json.loads(fetch("http://127.0.0.1:8104/v1/app/kategori"))
            if catalog.get("ok") is not True or not isinstance(catalog.get("items"), list):
                raise RuntimeError("Backend catalog health check failed")
            fetch("http://127.0.0.1:33030/kategori")
            if commit is not None and fetch("http://127.0.0.1:33030/deploy-version.txt").strip() != commit:
                raise RuntimeError("Wrong deployed commit")
            return True
        except (OSError, RuntimeError, ValueError, subprocess.SubprocessError):
            time.sleep(2)
    return False


def activate(release_id):
    preflight()
    previous = (BASE / "current").resolve()
    release, commit = unpack(release_id)
    backup_database(release_id)
    cache = release / "frontend/.next/cache"
    cache.mkdir(parents=True, exist_ok=True)
    run("chown", "-R", "root:bayarivo", str(release))
    run("chmod", "-R", "g+rX", str(release))
    run("chown", "-R", "bayarivo:bayarivo", str(cache))
    switch_current(release)
    try:
        restart()
        if not healthy(commit):
            raise RuntimeError("New release failed health/version checks")
    except Exception:
        switch_current(previous)
        restart()
        if not healthy():
            raise RuntimeError("Deployment failed and rollback health checks failed")
        raise RuntimeError("Deployment failed; previous release restored")
    print("Bayarivo deployed and verified: " + commit, flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("release_id", nargs="?")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        preflight()
        print("New server preflight passed; no release changed")
        return
    if not args.release_id:
        parser.error("release_id is required")
    import fcntl
    with open("/run/lock/bayarivo-deploy.lock", "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        activate(args.release_id)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

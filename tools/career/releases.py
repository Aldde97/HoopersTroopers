"""Package immutable game builds from the production branch's Git history."""
import hashlib
import re
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

# First Git-backed version in production before saves carried a release ID.
LEGACY = '71f46675d3ab5dd4e34061b35621f8a6262ecbf2'


def git(root, *args):
    return subprocess.check_output(['git', *args], cwd=root, text=True).strip()


def attach(game, version, runtime):
    html = game / 'index.html'
    config = json.dumps({'version': version, 'legacy': LEGACY})
    html.write_text(html.read_text() + '\n<script>window.BM_RELEASE=' + config
                    + ';</script>\n<script>' + runtime + '</script>\n')


def share_assets(game, target):
    """Keep unchanged game scripts and media under the same immutable URLs."""
    shared = game / 'release-assets'
    shared.mkdir(exist_ok=True)
    scripts = {}
    for path in target.glob('*.js'):
        name = hashlib.sha256(path.read_bytes()).hexdigest() + '.js'
        path.replace(shared / name)
        scripts[path.name] = '/play/release-assets/' + name

    media = hashlib.sha256()
    for path in sorted(target.rglob('*')):
        if path.is_file() and path != target / 'index.html':
            media.update(path.relative_to(target).as_posix().encode() + b'\0')
            media.update(hashlib.sha256(path.read_bytes()).digest())
    folder = shared / media.hexdigest()
    folder.mkdir(exist_ok=True)
    for path in target.iterdir():
        if path.name != 'index.html':
            if (folder / path.name).exists():
                shutil.rmtree(path) if path.is_dir() else path.unlink()
            else:
                path.rename(folder / path.name)

    page = target / 'index.html'
    html = re.sub(r'(<script src=")([^"?]+)([^"]*")',
                  lambda m: m[1] + scripts.get(m[2], m[2]) + m[3], page.read_text())
    html, count = re.subn(r'<head(?:\s[^>]*)?>', lambda m: m[0] +
                          '<base href="/play/release-assets/' + folder.name + '/">', html,
                          count=1, flags=re.I)
    if not count:
        html = '<base href="/play/release-assets/' + folder.name + '/">' + html
    page.write_text(html)


def package(root, game):
    root, game = Path(root), Path(game)
    if git(root, 'rev-parse', '--is-shallow-repository') == 'true':
        subprocess.run(['git', 'fetch', '--unshallow', 'origin'], cwd=root, check=True)
    subprocess.run(['git', 'merge-base', '--is-ancestor', LEGACY, 'HEAD'], cwd=root, check=True)
    paths = ['index.html', ':(top,glob)*.js', 'sprites', 'logos', 'cloud', 'cf_build.py', 'tools/career']
    changes = git(root, 'log', '--first-parent', '--reverse', '--format=%H',
                  LEGACY + '..HEAD', '--', *paths).splitlines()
    versions = [LEGACY, *changes]
    latest = versions[-1]
    runtime = (root / 'tools/career/runtime.js').read_text()
    archive = game / 'releases'
    archive.mkdir()
    for version in versions:
        target = archive / version
        if version == latest:
            shutil.copytree(game, target, ignore=shutil.ignore_patterns('releases', 'release-assets'))
        else:
            with tempfile.TemporaryDirectory() as tmp:
                with subprocess.Popen(['git', 'archive', version], cwd=root, stdout=subprocess.PIPE) as pack:
                    subprocess.run(['tar', '-xf', '-', '-C', tmp], stdin=pack.stdout, check=True)
                    if pack.wait():
                        raise RuntimeError('Could not extract release ' + version)
                subprocess.run(['python3', 'cf_build.py'], cwd=tmp, check=True,
                               env={**os.environ, 'BM_ARCHIVE_ONLY': '1'})
                shutil.move(str(Path(tmp) / 'dist/play'), target)
        adapter = target / 'career-runtime.js'
        if adapter.exists():
            pinned_runtime = adapter.read_text()
        else:
            pinned_runtime = git(root, 'show', changes[0] + ':tools/career/runtime.js') if changes else runtime
        attach(target, version, pinned_runtime)
        share_assets(game, target)
    # Keep the public entry URL and its old asset paths usable by already-open tabs.
    # Run every new session from an immutable directory, including the latest one.
    path = '/play/releases/' + latest + '/'
    (game / 'index.html').write_text('<!doctype html><meta charset="utf-8"><script>'
        + 'location.replace(' + json.dumps(path) + '+location.search+location.hash)</script>')
    (game / 'release.json').write_text(json.dumps({'version': latest}))

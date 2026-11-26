"""Apply the current account-storage boundary to every published engine revision."""
import json
import re
import shutil


def isolate_account(root, game, config):
    page = game / 'index.html'
    html = page.read_text()
    html, count = re.subn(r'window\.BM_CLOUD=\{[^<]*?\};',
                          lambda _: 'window.BM_CLOUD=' + json.dumps(config) + ';', html)
    if count != 1:
        raise ValueError('Missing cloud authentication bootstrap')
    page.write_text(html)
    shutil.copyfile(root / 'cloud/cloud.js', game / 'cloud.js')

    engine = game / 'engine.js'
    source = engine.read_text()
    changes = {
        "const KEY='bm-euroleague-save-v1';": """
let accountStorageOwner = null;
let unlockStorage;
const accountStorageReady = new Promise(resolve => { unlockStorage = resolve; });
function openAccountStorage(id) {
  if (!id || (accountStorageOwner && accountStorageOwner !== id)) return false;
  accountStorageOwner = id;
  unlockStorage(id);
  return true;
}
let KEY = null;""",
        "const KEYZ='bm-euroleague-save-z1',ZOK=": "let KEYZ = null; const ZOK=",
        "const SLOT_ACT='bm-slot-active-v1';": "let SLOT_ACT = null;",
        "indexedDB.open('bm-saves',1)": "indexedDB.open('bm-saves:' + accountStorageOwner,1)",
        "const SAVE_READY=(async()=>{try{IDB=await idbOpen();": """
const SAVE_READY=(async()=>{try{
    const owner = await accountStorageReady;
    KEY = 'bm-euroleague-save-v1:' + owner;
    KEYZ = 'bm-euroleague-save-z1:' + owner;
    SLOT_ACT = 'bm-slot-active-v1:' + owner;
    IDB=await idbOpen();""",
        "function loadSave(){try{": "function loadSave(){if(!KEY)return null;try{",
        "function save(){": "function save(){if(!KEY)return;",
    }
    for original, replacement in changes.items():
        if source.count(original) != 1:
            raise ValueError('Unsupported career storage implementation: ' + original)
        source = source.replace(original, replacement)
    engine.write_text(source)

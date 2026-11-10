#!/bin/sh
# iCloud offloads files on the Desktop, and an offloaded node_modules makes tools hang.
# Folders ending in .nosync aren't synced, so the real folder is node_modules.nosync and
# node_modules is a link to it. npm replaces the link on install, so always install with this.
set -e
cd "$(dirname "$0")/.."
[ -L node_modules ] && rm node_modules
[ -d node_modules.nosync ] && mv node_modules.nosync node_modules
npm install "$@"
mv node_modules node_modules.nosync
ln -s node_modules.nosync node_modules

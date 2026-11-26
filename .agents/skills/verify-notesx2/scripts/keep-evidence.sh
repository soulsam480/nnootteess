#!/usr/bin/env bash
set -euo pipefail

src=${1:?usage: keep-evidence.sh <browse-root-file> <evidence-name>}
name=${2:?usage: keep-evidence.sh <browse-root-file> <evidence-name>}
dst="$(cd "$(dirname "$0")/../evidence" && pwd)/$name"

mkdir -p "$(dirname "$dst")"
cp "$src" "$dst"
echo "$dst"

#!/bin/sh
# Descarga las imágenes generadas (requiere acceso a d8j0ntlcm91z4.cloudfront.net)
# y prepara las versiones web en site/assets/img/. Uso: sh tools/fetch-higgsfield.sh (desde proyectos/living-clean)
set -e
mkdir -p assets-src/higgsfield
python3 - <<'PY'
import json, subprocess
d = json.load(open('assets-src/higgsfield.json'))
for im in d['imagenes']:
    subprocess.run(['curl', '-fsSL', '-o', 'assets-src/higgsfield/' + im['archivo'], im['url']], check=True)
    print('ok', im['archivo'])
PY
python3 -I tools/images.py
node src/build.mjs

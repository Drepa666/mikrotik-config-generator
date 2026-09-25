# -*- coding: utf-8 -*-
import os, subprocess

# ════ Build workflow ════
BUILD_YML = """name: Build EXE

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Версія (напр. 3.1.0)'
        required: false
        default: '3.1.0'

jobs:
  build-windows:
    runs-on: windows-latest
    permissions:
      contents: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: JS syntax check
        run: |
          $failed = 0
          Get-ChildItem -Filter "*.js" -File | ForEach-Object {
            node --check $_.Name
            if ($LASTEXITCODE -ne 0) { $failed = 1 }
          }
          exit $failed
        shell: pwsh

      - name: Get version
        id: version
        run: |
          if ("${{ github.event_name }}" -eq "push") {
            $v = "${{ github.ref_name }}" -replace "^v", ""
          } else {
            $v = "${{ github.event.inputs.version }}"
          }
          echo "VERSION=$v" >> $env:GITHUB_OUTPUT
          echo "Building version: $v"
        shell: pwsh

      - name: Update package version
        run: |
          $pkg = Get-Content package.json | ConvertFrom-Json
          $pkg.version = "${{ steps.version.outputs.VERSION }}"
          $pkg | ConvertTo-Json -Depth 10 | Set-Content package.json
        shell: pwsh

      - name: Build EXE
        run: npm run build
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: List dist
        run: Get-ChildItem dist -Recurse | Select-Object Name, Length
        shell: pwsh

      - name: Upload EXE artifact
        uses: actions/upload-artifact@v4
        with:
          name: MikroTik-Manager-v${{ steps.version.outputs.VERSION }}-win
          path: |
            dist/*.exe
            dist/*.msi
          retention-days: 30

      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v2
        with:
          name: MikroTik Manager v${{ steps.version.outputs.VERSION }}
          body: |
            ## MikroTik Manager v${{ steps.version.outputs.VERSION }}

            ### Що нового:
            - Drag-and-drop для Firewall правил
            - AI Agent з аналізом Firewall
            - Traffic Monitor з графіком
            - IPC direct REST+SSH (без proxy.py)

            ### Встановлення:
            Завантаж `.exe` нижче і запусти інсталятор.
          files: |
            dist/*.exe
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
"""

# ════ .gitignore для py скриптів ════
GITIGNORE_ADD = """
# Python fix scripts
fix_*.py
find_*.py
read_*.py
add_*.py
apply_*.py
check_*.py
step*.py
diag*.py
build_exe.py
cleanup.py
tempfile*.js
"""

# Записуємо workflow
os.makedirs('.github/workflows', exist_ok=True)
with open('.github/workflows/build.yml', 'w', encoding='utf-8') as f:
    f.write(BUILD_YML)
print('OK: .github/workflows/build.yml створено')

# Оновлюємо .gitignore
gitignore_path = '.gitignore'
if os.path.exists(gitignore_path):
    with open(gitignore_path, 'r', encoding='utf-8') as f:
        existing = f.read()
else:
    existing = ''

if 'fix_*.py' not in existing:
    with open(gitignore_path, 'a', encoding='utf-8') as f:
        f.write(GITIGNORE_ADD)
    print('OK: .gitignore оновлено')
else:
    print('OK: .gitignore вже містить py правила')

# Видаляємо py скрипти з git tracking
result = subprocess.run(
    ['git', 'ls-files', '--error-unmatch', 'fix_health.py'],
    capture_output=True, text=True
)
if result.returncode == 0:
    # Файли в git — прибираємо
    subprocess.run(['git', 'rm', '--cached', '--force',
        'fix_*.py', 'find_*.py', 'read_*.py', 'add_*.py',
        'apply_*.py', 'check_*.py'], capture_output=True)
    print('OK: py скрипти прибрано з git')

# Git
subprocess.run(['git','pull','--rebase','origin','main'], capture_output=True)
subprocess.run(['git','add','.github/workflows/build.yml','.gitignore'], capture_output=True)
subprocess.run(['git','commit','-m',
    'ci: add Windows EXE build workflow + .gitignore for py scripts'],
    capture_output=True)
rp = subprocess.run(['git','push','origin','main'], capture_output=True, text=True)
print('push:', rp.stdout.strip() or rp.stderr.strip()[-80:])
print('\nDone!')
print('\nЯк зібрати EXE:')
print('  Варіант 1 (тег): git tag v3.1.0 && git push origin v3.1.0')
print('  Варіант 2 (ручний): GitHub → Actions → Build EXE → Run workflow')
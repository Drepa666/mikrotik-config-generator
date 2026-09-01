import subprocess, os

files = [f for f in os.listdir('.') if f.endswith('.js')]
failed = []

for f in sorted(files):
    result = subprocess.run(
        ['node', '--check', f],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print('❌ FAIL: ' + f)
        print('   ' + result.stderr.strip()[:150])
        failed.append(f)
    else:
        print('✅ OK: ' + f)

print('\nПомилок: ' + str(len(failed)))
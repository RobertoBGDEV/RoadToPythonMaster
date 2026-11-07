"""Quote plain YAML scalars that contain ': ' (a common authoring slip). Usage: python3 scripts/fix-yaml-colons.py"""
import re, glob, json
KEYS = r'(?:summary|title|q|why|explain|caption|complexity|leetcode)'
scalar_kv = re.compile(r'^(\s*(?:- )?' + KEYS + r'):\s+([^"\'|>\[{#&*!%@`\s].*)$')
list_item = re.compile(r'^(\s*- )([^"\'|>\[{#&*!%@`\s].*)$')
for f in glob.glob('content/**/*.yaml', recursive=True):
    out, n = [], 0
    for line in open(f).read().split('\n'):
        m = scalar_kv.match(line)
        if m and (': ' in m.group(2) or m.group(2).rstrip().endswith(':')):
            line = f"{m.group(1)}: {json.dumps(m.group(2), ensure_ascii=False)}"; n += 1
        else:
            m = list_item.match(line)
            if m and ': ' in m.group(2):
                key = m.group(2).split(': ', 1)[0]
                if not re.fullmatch(r'[A-Za-z_]+', key):
                    line = m.group(1) + json.dumps(m.group(2), ensure_ascii=False); n += 1
        out.append(line)
    if n:
        open(f, 'w').write('\n'.join(out)); print(f, n)

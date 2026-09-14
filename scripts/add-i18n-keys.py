#!/usr/bin/env python3
"""Добавляет ключи переводов сразу в три словаря.

Использование: python3 scripts/add-i18n-keys.py < keys.json
Формат: {"ru": {"key": "текст"}, "uz": {...}, "en": {...}}
Существующие ключи пропускаются; тест покрытия проверит, что набор ключей совпадает.
"""
import json
import os
import sys

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'i18n')


def literal(value: str) -> str:
    if "'" in value and '"' not in value:
        return '"' + value + '"'
    if "'" in value:
        return "'" + value.replace("'", "\\'") + "'"
    return "'" + value + "'"


def main() -> None:
    data = json.load(sys.stdin)
    for lang, pairs in data.items():
        path = os.path.join(BASE, f'{lang}.ts')
        with open(path, encoding='utf-8') as handle:
            source = handle.read()
        tail = '\n} as const;\n' if lang == 'ru' else '\n};\n'
        if not source.endswith(tail):
            raise SystemExit(f'{path}: неожиданное окончание файла')
        body = source[: -len(tail)]
        added = [f"  '{key}': {literal(value)}," for key, value in pairs.items() if f"'{key}':" not in source]
        if added:
            body += '\n\n' + '\n'.join(added)
        with open(path, 'w', encoding='utf-8') as handle:
            handle.write(body + tail)
        print(f'{lang}: +{len(added)}')


if __name__ == '__main__':
    main()

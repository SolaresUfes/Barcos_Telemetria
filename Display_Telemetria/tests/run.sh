#!/usr/bin/env bash
set -euo pipefail
pasta_testes="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
pasta_binarios="$(mktemp -d)"
trap 'rm -rf -- "$pasta_binarios"' EXIT
cxx="${CXX:-g++}"
"$cxx" -std=c++11 -Wall -Wextra -Werror "$pasta_testes/busca_canal_test.cpp" -o "$pasta_binarios/busca"
"$pasta_binarios/busca"
"$cxx" -std=c++11 -Wall -Wextra -Werror -I"$pasta_testes/radio_stubs" "$pasta_testes/espnow_test.cpp" -o "$pasta_binarios/radio"
"$pasta_binarios/radio"
printf 'Testes de busca e recepção ESP-NOW passaram.\n'

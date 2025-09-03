#!/bin/bash
find . -name "*.backup-no-undef" -type f | while read backup; do
  original="${backup%.backup-no-undef}"
  cp "$backup" "$original"
  echo "Restored: $original"
done

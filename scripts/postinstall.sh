#!/bin/bash

if [ -d prisma-main ]; then
    npx prisma generate --schema ./prisma-main/schema.prisma
    npx prisma generate --schema ./prisma-e2e/schema.prisma

    PRISMA_DIRS=("prisma-main" "prisma-e2e")

    for dir in "${PRISMA_DIRS[@]}"; do
        LIBRARY_FILE="./${dir}/types/runtime/library.js"

        if [ -f "$LIBRARY_FILE" ]; then
            echo "Fixing source map reference in $LIBRARY_FILE"
            sed -i '/^\/\/# sourceMappingURL=library.js.map$/d' "$LIBRARY_FILE"
        fi
    done
fi

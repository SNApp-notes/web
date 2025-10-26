FROM playwright:e2e-local

WORKDIR /app

RUN npm init -y

RUN npm install @playwright/test

RUN mkdir -p results report .auth && chmod -R 777 results report .auth

CMD ["npx", "playwright", "test"]

FROM playwright:e2e-local

WORKDIR /app

RUN npm init -y

RUN npm install @playwright/test

RUN mkdir -p results report && chmod -R 777 results report

CMD ["npx", "playwright", "test"]

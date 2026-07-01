require('ts-node/register');

const { prepareTestDatabase } = require('../../server/test/test-database.ts');

prepareTestDatabase('file:./playwright.sqlite').catch((error) => {
  console.error(error);
  process.exit(1);
});

/*
    Copyright (c) 2026 gematik GmbH
    Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
    European Commission – subsequent versions of the EUPL (the "Licence").
    You may not use this work except in compliance with the Licence.
    You find a copy of the Licence in the "Licence" file or at
    https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
    Unless required by applicable law or agreed to in writing,
    software distributed under the Licence is distributed on an "AS IS" basis,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
    In case of changes by gematik find details in the "Readme" file.
    See the Licence for the specific language governing permissions and limitations under the Licence.
    *******
    For additional notes and disclaimer from gematik and in case of changes by gematik,
    find details in the "Readme" file.
 */

import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import angular from '@analogjs/vite-plugin-angular';
import { fileURLToPath, URL } from 'node:url';
import { name as pkgName } from './package.json';

export default defineConfig({
  plugins: [angular()],
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
    // With npm-linked libraries (e.g. demis-portal-core-library), Vite otherwise resolves the
    // symlink's real path and picks up a second copy of @angular/* from that package's own
    // node_modules, causing duplicate Angular instances (symptom: NG0203 inject() context errors
    // from services in the linked library, e.g. MatCard).
    preserveSymlinks: true,
  },
  test: {
    globals: true,
    restoreMocks: true,
    api: {
      host: '127.0.0.1',
      port: 51204,
    },
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default', ['junit', { suiteName: pkgName }]],
    outputFile: {
      junit: `./coverage/TEST-${pkgName}.xml`,
    },
    browser: {
      enabled: true,
      api: {
        host: '127.0.0.1',
        port: 51205,
      },
      provider: playwright({
        launchOptions: {
          args: ['--no-sandbox'],
        },
      }),
      headless: true,
      viewport: { width: 1280, height: 1024 },
      instances: [{ browser: 'chromium' }],
    },
    testTimeout: 10000,
    // Browser-driven tests spin up one Chromium instance per worker; under CPU contention
    // (many parallel test files/workers) individual UI interactions can occasionally exceed
    // testTimeout even though the test itself is not broken. Retry once before failing.
    retry: 1,
    coverage: {
      provider: 'istanbul',
      exclude: ['src/api/**'],
      reporter: ['text', 'text-summary', 'html', 'lcov', 'cobertura'],
      reportsDirectory: './coverage',
    },
  },
});

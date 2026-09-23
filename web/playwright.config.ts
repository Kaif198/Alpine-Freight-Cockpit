import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir:'./tests',fullyParallel:false,workers:1,timeout:30000,
  reporter:[['list']],
  use:{baseURL:process.env.TEST_URL||(process.env.CI?'http://127.0.0.1:4173':'http://127.0.0.1:5173'),channel:process.env.CI?'chromium':'chrome',headless:true,viewport:{width:1440,height:1000},reducedMotion:'reduce',screenshot:'only-on-failure'},
  webServer:process.env.CI?{command:'npm run preview -- --port 4173',url:'http://127.0.0.1:4173',timeout:30000}:undefined,
})

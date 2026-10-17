import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

function cloudApiMockPlugin() {
  return {
    name: 'cloud-api-mock',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api/v1/cloud')) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('X-Powered-By', 'InfraPulse-Cloud-Engine/1.0')

          try {
            const mockRaw = fs.readFileSync(
              path.resolve(process.cwd(), 'src/data/mockData.json'),
              'utf-8'
            )
            const mock = JSON.parse(mockRaw)

            if (req.url === '/api/v1/cloud/services' || req.url.startsWith('/api/v1/cloud/services?')) {
              res.statusCode = 200
              return res.end(
                JSON.stringify({
                  status: 'success',
                  endpoint: 'cloudServicesFunction',
                  timestamp: new Date().toISOString(),
                  totalCount: mock.services.length,
                  services: mock.services,
                })
              )
            }

            if (req.url.includes('/metrics')) {
              res.statusCode = 200
              return res.end(
                JSON.stringify({
                  status: 'success',
                  endpoint: 'cloudServiceMetricsFunction',
                  metrics: {
                    cpuPercent: 14.8,
                    ramPercent: 38.2,
                    networkIoMbps: 88.4,
                    uptimePercent: 99.99,
                  },
                })
              )
            }

            if (req.url.startsWith('/api/v1/cloud/billing') || req.url.startsWith('/api/v1/cloud/invoices')) {
              res.statusCode = 200
              return res.end(
                JSON.stringify({
                  status: 'success',
                  endpoint: 'cloudBillingInvoicesFunction',
                  invoices: mock.invoices,
                  walletBalance: mock.organization.walletBalance,
                })
              )
            }

            res.statusCode = 200
            return res.end(
              JSON.stringify({
                status: 'success',
                endpoint: 'cloudOperationFunction',
                message: 'InfraPulse Cloud API operation completed',
                timestamp: new Date().toISOString(),
              })
            )
          } catch (err) {
            res.statusCode = 500
            return res.end(JSON.stringify({ error: err.message }))
          }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudApiMockPlugin(),
  ],
})
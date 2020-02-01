import express, { ErrorRequestHandler } from 'express'
import cors from 'cors'
import * as functions from 'firebase-functions'
import { logRequestStart } from './util/log-request'
import { RELEASE_ID } from './release'
import { server } from './graphql'
import * as Sentry from '@sentry/node'

import { router as userRouter } from './routes/user.routes'
import { router as organisationRouter } from './routes/organisation.routes'
import { router as spwDotComRouter } from './routes/speelpleinwerking.com.routes'

const app = express()

Sentry.init({
  dsn: 'https://e2b8d5b8c87143948e4a0ca794fd06b2@sentry.io/1474167',
  release: RELEASE_ID,
})

app.use(Sentry.Handlers.requestHandler())

// Log all requests
app.use(logRequestStart)

// Automatically allow cross-origin requests
app.use(cors({ origin: true }))

// Mount routes
app.use('/speelpleinwerking.com', spwDotComRouter)
app.use('/user', userRouter)
app.use('/organisation', organisationRouter)

app.use('/version', (req, res) => res.json({ release: RELEASE_ID }))

server.applyMiddleware({ path: '/graphql', app })

// Error handlers

app.use((err, req, res, next) => {
  Sentry.configureScope(scope => {
    scope.setUser({
      email: res.locals.user?.email,
      id: res.locals.user?.uid,
      username: res.locals.user?.name,
      // eslint-disable-next-line @typescript-eslint/camelcase
      ip_address: req.header('X-Forwarded-For'),
    })

    if (req.params.tenant) {
      scope.setExtra('tenant', req.params.tenant)
    }

    next(err)
  })
}, Sentry.Handlers.errorHandler())

const errorRequestHandler: ErrorRequestHandler = (err, req, res) => {
  console.error(err)
  if (err.cause) {
    console.error('Cause:')
    console.error(err.cause)
  }

  res.status(500).json({
    status: 'error',
    message: err.message,
    cause: err.cause?.message,
  })
}

app.use(errorRequestHandler)

export const api = functions.region('europe-west1').https.onRequest(app)
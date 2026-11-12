import express from 'express';
import { toNodeHandler } from 'better-auth/node';

import { auth } from './auth/index.js';
import { errorHandler } from './errors/error-response.js';
import { requestContext } from './middleware/request-context.js';
import apiRouter from './routes/index.js';

const app = express();

// Assign a unique ID to every request.
app.use(requestContext);

// Better Auth handles its own request parsing.
// Register this before express.json().
app.all('/api/auth/*splat', toNodeHandler(auth));

// Parse JSON for our application API routes.
app.use(express.json());

// Versioned application API.
app.use('/api', apiRouter);

// Health check endpoint.
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'outreach-crm-api',
  });
});

// Centralized error handling must be registered last.
app.use(errorHandler);

export default app;

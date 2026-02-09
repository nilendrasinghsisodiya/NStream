import { createTestApp } from './createApp.js';
import request from 'supertest';
let agent = undefined;

export function getAgent() {
  if (!agent) {
    const app = createTestApp();
    agent = request.agent(app);

    return agent;
  }
  return agent;
}

export function logInAgent(agent = getAgent(), overrides = {}) {
  return agent.post('/auth/login').send({
    email: 'test@test.com',
    password: 'test12345',
    ...overrides,
  });
}

// Testing Middleware

import {UnauthorizedError} from 'express-jwt'
import errorMiddleware from '../error-middleware'

function buildRes(overrides) {
  const res = {
    json: jest.fn(() => res),
    status: jest.fn(() => res),
    ...overrides
  }
  return res
}

test('responds with 401 for express-jwt UnauthorizedError', () => {
  const req = {}
  const next = jest.fn()
  const error = new UnauthorizedError('some_error_code', {message: 'Some message'})
  const res = buildRes()

  errorMiddleware(error, req, res, next)

  expect(next).not.toHaveBeenCalled()

  expect(res.status).toHaveBeenCalledTimes(1)
  expect(res.status).toHaveBeenCalledWith(401)

  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json).toHaveBeenCalledWith({code: error.code, message: error.message})
});

test('skip throwing an error if res has been sent', () => {
  const req = {}
  const error = new Error('blah')
  const next = jest.fn()
  const res = buildRes({headersSent: true})

  errorMiddleware(error, req, res, next)

  expect(next).toHaveBeenCalledTimes(1)
  expect(next).toHaveBeenCalledWith(error)

  expect(res.json).not.toHaveBeenCalled()
  expect(res.status).not.toHaveBeenCalled()
});

test('returns 500 with error log if unknown error', () => {
  const req = {}
  const error = new Error('blah')
  const next = jest.fn()
  const res = buildRes()

  errorMiddleware(error, req, res, next)

  expect(next).not.toHaveBeenCalled()

  expect(res.status).toHaveBeenCalledTimes(1)
  expect(res.status).toHaveBeenCalledWith(500)

  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json).toHaveBeenCalledWith({message: error.message, stack: error.stack})
});

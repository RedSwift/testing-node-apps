// Testing Middleware

import {UnauthorizedError} from 'express-jwt'
import errorMiddleware from '../error-middleware'

test('responds with 401 for express-jwt UnauthorizedError', () => {
  const req = {}
  const next = jest.fn()
  const code = 'some_error_code'
  const message = 'Some message'
  const error = new UnauthorizedError(code, {message})
  const res = {json: jest.fn(() => res), status: jest.fn(() => res)} 

  errorMiddleware(error, req, res, next)

  expect(next).not.toHaveBeenCalled()

  expect(res.status).toHaveBeenCalledTimes(1)
  expect(res.status).toHaveBeenCalledWith(401)

  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json).toHaveBeenCalledWith({code: error.code, message: error.message})
});

// 🐨 Write a test for the headersSent case
test('skip throwing an error if res has been sent', () => {
  const req = {}
  const error = new Error('blah')
  const next = jest.fn()
  const res = {json: jest.fn(() => res), status: jest.fn(() => res), headersSent: true}

  errorMiddleware(error, req, res, next)

  expect(next).toHaveBeenCalledTimes(1)
  expect(next).toHaveBeenCalledWith(error)

  expect(res.json).not.toHaveBeenCalled()
  expect(res.status).not.toHaveBeenCalled()
});

// 🐨 Write a test for the else case (responds with a 500)

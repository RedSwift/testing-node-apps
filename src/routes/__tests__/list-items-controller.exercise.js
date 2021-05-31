// Testing Controllers

import {
  buildRes,
  buildReq,
  buildUser,
  buildBook,
  buildListItem,
  buildNext,
} from 'utils/generate'
import * as booksDB from '../../db/books'
import * as listItemDB from '../../db/list-items'
import * as listItemsController from '../list-items-controller'

jest.mock('../../db/books')
jest.mock('../../db/list-items')

afterEach(() => {
  jest.resetAllMocks()
})

test('getListItem returns the req.listItem', async () => {
  const user = buildUser()
  const book = buildBook()
  const listItem = buildListItem({ownerId: user.id, bookId: book.id})

  booksDB.readById.mockResolvedValueOnce(book)

  const req = buildReq({user, listItem})
  const res = buildRes()

  await listItemsController.getListItem(req, res)

  expect(booksDB.readById).toHaveBeenCalledTimes(1)
  expect(booksDB.readById).toHaveBeenCalledWith(book.id)

  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json).toHaveBeenCalledWith({listItem: {...listItem, book}})
})

test('createListItem returns error if no book id provided', async () => {
  const user = buildUser()
  const req = buildReq({user})
  const res = buildRes()

  await listItemsController.createListItem(req, res)

  expect(res.status).toHaveBeenCalledWith(400)
  expect(res.status).toHaveBeenCalledTimes(1)

  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": "No bookId provided",
      },
    ]
  `)
})

describe('setListItem', () => {
  test('returns error if no list item found with id', async () => {
    const req = buildReq()
    const res = buildRes()

    listItemDB.readById.mockResolvedValueOnce(null)

    await listItemsController.setListItem(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.status).toHaveBeenCalledTimes(1)

    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "No list item was found with the id of undefined",
        },
      ]
    `)
  })

  test('sets list item in req header if list item is found', async () => {
    const listItem = buildListItem()
    const user = buildUser({id: listItem.ownerId})

    const req = buildReq({user, params: {id: listItem.id}})
    const res = buildRes()
    const next = buildNext()

    listItemDB.readById.mockResolvedValueOnce(listItem)

    await listItemsController.setListItem(req, res, next)

    expect(req.listItem).toEqual(listItem)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('returns 403 if user and list item owner does not match', async () => {
    const listItem = buildListItem({id: 1})
    const user = buildUser({id: 2})

    const req = buildReq({user, params: {id: listItem.id}})
    const res = buildRes()

    listItemDB.readById.mockResolvedValueOnce(listItem)

    await listItemsController.setListItem(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.status).toHaveBeenCalledTimes(1)

    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "User with id 2 is not authorized to access the list item 1",
        },
      ]
    `)
  })
})

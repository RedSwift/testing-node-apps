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
    const fakeListItemId = 'FAKE_LIST_ITEM_ID'
    const req = buildReq({params: {id: fakeListItemId}})
    const res = buildRes()
    const next = buildNext()

    listItemDB.readById.mockResolvedValueOnce(null)

    await listItemsController.setListItem(req, res)

    expect(listItemDB.readById).toHaveBeenCalledWith(fakeListItemId)
    expect(listItemDB.readById).toHaveBeenCalledTimes(1)

    expect(next).not.toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.status).toHaveBeenCalledTimes(1)

    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "No list item was found with the id of FAKE_LIST_ITEM_ID",
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

    expect(listItemDB.readById).toHaveBeenCalledWith(listItem.id)
    expect(listItemDB.readById).toHaveBeenCalledTimes(1)

    expect(req.listItem).toEqual(listItem)

    expect(next).toHaveBeenCalledWith(/* nothing */)
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('returns 403 if user and list item owner does not match', async () => {
    const fakeUserId = 'FAKE_USER_ID'
    const listItem = buildListItem({id: 'FAKE_LIST_ITEM_ID', ownerId: 'SOMEONE_ELSE'})
    const user = buildUser({id: fakeUserId})

    const req = buildReq({user, params: {id: listItem.id}})
    const res = buildRes()
    const next = buildNext()

    listItemDB.readById.mockResolvedValueOnce(listItem)

    await listItemsController.setListItem(req, res, next)

    expect(listItemDB.readById).toHaveBeenCalledTimes(1)
    expect(listItemDB.readById).toHaveBeenCalledWith(listItem.id)

    expect(next).not.toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.status).toHaveBeenCalledTimes(1)

    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "User with id FAKE_USER_ID is not authorized to access the list item FAKE_LIST_ITEM_ID",
        },
      ]
    `)
  })
})

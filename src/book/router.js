import Router from 'koa-router';
import bookStore from './store';
import { broadcast } from "../utils";

export const router = new Router();

router.get('/books', async (ctx) => {
  const response = ctx.response;
  const userId = ctx.state.user._id;
  response.body = await bookStore.find({ userId });
  response.status = 200; // ok
  //console.log(response.body);
});

router.get('/book/:id', async (ctx) => {
  const userId = ctx.state.user._id;
  const book = await bookStore.findOne({ _id: ctx.params.id });
  const response = ctx.response;
  if (book) {
    if (book.userId === userId) {
      response.body = book;
      response.status = 200; // ok
    } else {
      response.status = 403; // forbidden
    }
  } else {
    response.status = 404; // not found
  }
});

const createBook = async (ctx, book, response) => {
  //console.log("SE CREEAZA O CARTE");
  try {
    const userId = ctx.state.user._id;
    book.userId = userId;
    response.body = await bookStore.insert(book);
    response.status = 201; // created
    console.log(response.body);
    broadcast(userId, { type: 'created', payload: response.body });
  } catch (err) {
    response.body = { message: err.message };
    response.status = 400; // bad request
  }
};

router.post('/book', async ctx => await createBook(ctx, ctx.request.body, ctx.response));

router.put('/book/:id', async (ctx) => {
  console.log("SE EDITEAZA O CARTE");
  const book = ctx.request.body;
  const id = ctx.params.id;
  const bookId = book._id;
  const response = ctx.response;
  if (bookId && bookId !== id) {
    response.body = { message: 'Param id and body _id should be the same' };
    response.status = 400; // bad request
    return;
  }
  const userId = ctx.state.user._id;
  book.userId = userId;
  const updatedCount = await bookStore.update({ _id: id }, book);
  if (updatedCount === 1) {
    response.body = book;
    response.status = 200; // ok
    console.log(book);
    broadcast(userId, { type: 'updated', payload: book });
  } else {
    response.body = { message: 'Resource no longer exists' };
    response.status = 405; // method not allowed
    }
});

router.del('/book/:id', async (ctx) => {
  const userId = ctx.state.user._id;
  const book = await bookStore.findOne({ _id: ctx.params.id });
  if (book && userId !== book.userId) {
    ctx.response.status = 403; // forbidden
  } else {
    await bookStore.remove({ _id: ctx.params.id });
    ctx.response.status = 204; // no content
  }
});

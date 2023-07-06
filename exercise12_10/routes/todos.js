const express = require('express');
const { Todo } = require('../mongo')
const router = express.Router();
const redis = require('../redis')

/* GET todos listing. */
router.get('/', async (_, res) => {
  const todos = await Todo.find({})
  res.send(todos);
});

/* POST todo to listing. */
router.post('/', async (req, res) => {
  const todo = await Todo.create({
    text: req.body.text,
    done: false
  })
  res.send(todo);
});

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params
  req.todo = await Todo.findById(id)
  if (!req.todo) return res.sendStatus(404)

  next()
}

/* DELETE todo. */
singleRouter.delete('/', async (req, res) => {
  await req.todo.delete()  
  res.sendStatus(200);
});

/* GET todo. */
singleRouter.get('/', async (req, res) => {
  res.send(req.todo);
});

/* PUT todo. */
singleRouter.put('/', async (req, res) => {

  const body = req.body
  const todo = {
    text: body.text,
    done: body.done,
  }
  const added_amount = Number((await redis.getAsync("added_todos")) || 0);
  redis.setAsync("added_todos", added_amount + 1)

  Todo.findByIdAndUpdate(req.todo._id, todo)
    .then(updatedTodo => {
      //Not sure why updatedTodo does not send the updated data itself... but it works.
      
      res.send({
        _id: updatedTodo._id,
        text: body.text,
        done: body.done,
      });
    })
    .catch(error => next(error))
});

router.use('/:id', findByIdMiddleware, singleRouter)


module.exports = router;

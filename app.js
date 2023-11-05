const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const dbPath = "todoApplication.db";

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(2375, () => {
      console.log("Server Running at http://localhost:2375/");
    });
  } catch (e) {
    console.error(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1: Get todos based on status, priority, or search query
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q } = request.query;
  let getTodosQuery = `
    SELECT id, todo, priority, status
    FROM todo
    WHERE 1`;

  if (status) {
    getTodosQuery += ` AND status = '${status}'`;
  }

  if (priority) {
    getTodosQuery += ` AND priority = '${priority}'`;
  }

  if (search_q) {
    getTodosQuery += ` AND todo LIKE '%${search_q}%'`;
  }

  try {
    const todos = await db.all(getTodosQuery);
    response.send(todos);
  } catch (e) {
    console.error(`Error fetching todos: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 2: Get a todo by ID
app.get("/todos/:todoId/", async (request, response) => {
  const todoId = request.params.todoId;

  const getTodoQuery = `
    SELECT id, todo, priority, status
    FROM todo
    WHERE id = ${todoId};`;

  try {
    const todo = await db.get(getTodoQuery);

    if (todo) {
      response.send(todo);
    } else {
      response.status(404).send("Todo not found");
    }
  } catch (e) {
    console.error(`Error fetching todo: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 3: Create a todo
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const createTodoQuery = `
    INSERT INTO todo (id, todo, priority, status)
    VALUES (${id}, '${todo}', '${priority}', '${status}');`;

  try {
    await db.run(createTodoQuery);
    response.send("Todo Successfully Added");
  } catch (e) {
    console.error(`Error creating todo: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 4: Update a todo by ID
app.put("/todos/:todoId/", async (request, response) => {
  const todoId = request.params.todoId;
  const { todo, priority, status } = request.body;

  let updateTodoQuery = "UPDATE todo SET";

  if (todo) {
    updateTodoQuery += ` todo = '${todo}',`;
  }

  if (priority) {
    updateTodoQuery += ` priority = '${priority}',`;
  }

  if (status) {
    updateTodoQuery += ` status = '${status}',`;
  }

  // Remove trailing comma
  updateTodoQuery = updateTodoQuery.slice(0, -1);

  updateTodoQuery += ` WHERE id = ${todoId};`;

  try {
    await db.run(updateTodoQuery);
    if (status) {
      response.send("Status Updated");
    } else if (priority) {
      response.send("Priority Updated");
    } else {
      response.send("Todo Updated");
    }
  } catch (e) {
    console.error(`Error updating todo: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 5: Delete a todo by ID
app.delete("/todos/:todoId/", async (request, response) => {
  const todoId = request.params.todoId;

  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`;

  try {
    await db.run(deleteTodoQuery);
    response.send("Todo Deleted");
  } catch (e) {
    console.error(`Error deleting todo: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

module.exports = app;

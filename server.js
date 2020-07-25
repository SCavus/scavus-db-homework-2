const dotenv = require("dotenv");
const express = require("express");
const mongodb = require("mongodb");

const { getPutBodyIsAllowed } = require("./util");

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

const uri = process.env.DATABASE_URI;

const client = new mongodb.MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.post("/books", (req, res) => {
  const {
    title,
    author,
    author_birth_year,
    author_death_year,
    url,
  } = req.query;

  client.connect(() => {
    const db = client.db("literature");
    const collection = db.collection("books");

    let book = {};

    if (!title || !author || !author_birth_year || !author_death_year || !url) {
      res.send(400);
    } else {
      book.title = title;
      book.author = author;
      book.author_birth_year = Number(author_birth_year);
      book.author_death_year = Number(author_death_year);
      book.url = url;
    }

    collection.insertOne(book, (error, result) => {
      res.send(error || result.ops[0]);
      client.close();
    });
  });
});

app.delete("/books/:id", (req, res) => {
  client.connect(() => {
    const db = client.db("literature");
    const collection = db.collection("books");

    let id = undefined;
    const string = req.params.id;

    if (mongodb.ObjectID.isValid(string)) {
      id = new mongodb.ObjectID(string);
    } else {
      client.close();
      return res.status(400).send("ID is not valid!");
    }

    const searchObj = { _id: id };

    collection.deleteOne(searchObj, (error, result) => {
      res.send(error || result);
      client.close();
    });
  });
});

app.put("/books/:id", (req, res) => {
  client.connect(() => {
    const db = client.db("literature");
    const collection = db.collection("books");
    let updateObj = {};
    const {
      title,
      author,
      author_birth_year,
      author_death_year,
      url,
    } = req.body;

    let id;
    const string = req.params.id;

    if (mongodb.ObjectID.isValid(string)) {
      id = new mongodb.ObjectID(string);
    } else {
      client.close();
      return res.status(400).send("ID is not valid!");
    }

    const searchObj = { _id: id };

    if (
      isNaN(author_birth_year) ||
      isNaN(author_death_year) ||
      typeof title != "string" ||
      typeof author != "string" ||
      typeof url != "string"
    ) {
      res.status(422).send("Please check type of input!");
    } else {
      updateObj.title = title;
      updateObj.author = author;
      updateObj.author_birth_year = author_birth_year;
      updateObj.author_death_year = author_death_year;
      updateObj.url = url;
    }

    if (req.body.id) {
      res.status(403).send("You can not change ID of the document!");
    }
    // getPutBodyIsAllowed(updateObj)

    const options = { returnOriginal: false };

    collection.findOneAndUpdate(
      searchObj,
      { $set: updateObj },
      (error, result) => {
        res.send(error || result.value);
        client.close();
      }
    );
  });
});

app.get("/api/books", function (request, response) {
  const client = new mongodb.MongoClient(uri);

  client.connect(function () {
    const db = client.db("literature");
    const collection = db.collection("books");

    const searchObject = {};

    if (request.query.title) {
      searchObject.title = request.query.title;
    }

    if (request.query.author) {
      searchObject.author = request.query.author;
    }

    collection.find(searchObject).toArray(function (error, books) {
      response.send(error || books);
      client.close();
    });
  });
});

app.get("/api/books/:id", function (request, response) {
  const client = new mongodb.MongoClient(uri);

  let id;
  try {
    id = new mongodb.ObjectID(request.params.id);
  } catch (error) {
    response.sendStatus(400);
    return;
  }

  client.connect(function () {
    const db = client.db("literature");
    const collection = db.collection("books");

    const searchObject = { _id: id };

    collection.findOne(searchObject, function (error, book) {
      if (!book) {
        response.sendStatus(404);
      } else {
        response.send(error || book);
      }

      client.close();
    });
  });
});

app.get("/", function (request, response) {
  response.sendFile(__dirname + "/index.html");
});

app.get("/books/new", function (request, response) {
  response.sendFile(__dirname + "/new-book.html");
});

app.get("/books/:id", function (request, response) {
  response.sendFile(__dirname + "/book.html");
});

app.get("/books/:id/edit", function (request, response) {
  response.sendFile(__dirname + "/edit-book.html");
});

app.get("/authors/:name", function (request, response) {
  response.sendFile(__dirname + "/author.html");
});

app.listen(port || 3000, function () {
  console.log(`Running at \`http://localhost:${port}\`...`);
});

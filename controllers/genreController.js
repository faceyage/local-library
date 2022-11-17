const Genre = require("../models/genre");
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = (req, res, next) => {
  Genre.find()
    .sort({ name: 1 })
    .exec(function (err, list_genres) {
      if (err) return next(err);

      res.render("genre_list", {
        title: "Genre list",
        genre_list: list_genres,
      });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },

      genre_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
        if (err) {
          return next(err);
        }

        if (found_genre) {
          // Genre exists, redirect to its detail page.
          res.redirect(found_genre.url);
        } else {
          genre.save((err) => {
            if (err) {
              return next(err);
            }
            // Genre saved. Redirect to genre detail page.
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        res.redirect("/catalog/genres");
      }
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.body.genreid).exec(callback);
      },
      genre_books(callback) {
        Book.find({ genre: req.body.genreid }).exec(callback);
      },
    },
    (err, results) => {
      if (err) return next(err);

      //Success
      if (results.genre_books.length > 0) {
        //genre has book render same as get route
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genre_books,
        });
        return; //stop execution
      }

      Genre.findByIdAndRemove(req.body.genreid, (err) => {
        if (err) return next(err);
        //Success(removed) go to genres list
        res.redirect("/catalog/genres");
      });
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
    },
    (err, results) => {
      if (err) return next(err);
      if (results.genre == null) {
        //No results
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }

      //Success
      res.render("genre_form", {
        title: "Update Genre",
        genre: results.genre,
      });
    }
  );
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and sanitize fields.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    // Check if has errors
    if (!errors.isEmpty()) {
      //There are errors. Render form again with sanitized values

      //same as get update
      res.render("genre_form", {
        title: "Update Genre",
        name: req.body.name,
        errors: errors.array(),
      });

      return;
    }

    // Data form is valid. Update record
    Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
      if (err) return next(err);

      // Succesfful redirect to genre detail page
      res.redirect(thegenre.url);
    });
  },
];
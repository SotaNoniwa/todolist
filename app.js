const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

  const itemSchema = new mongoose.Schema({
    name: String,
  });

  const Item = mongoose.model("Item", itemSchema);

  const item1 = new Item({
    name: "Welcome to your todolist!",
  });

  const item2 = new Item({
    name: "Hit the + button to add a new item.",
  });

  const item3 = new Item({
    name: "<-- Hit this to delete an item.",
  });

  const defaultItems = [item1, item2, item3];

  const listSchema = {
    name: String,
    items: [itemSchema],
  };

  const List = mongoose.model("List", listSchema);

  app.get("/", function (req, res) {
    Item.find({})
      .then(function (foundItems) {
        if (foundItems.length === 0) {
          Item.insertMany(defaultItems)
            .then(function () {
              console.log("succesfully insert items");
            })
            .catch(function (err) {
              console.log(err);
            });
          res.redirect("/");
        } else {
          res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  });

  app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const firstCaracter = itemName.charAt(0).toUpperCase();
    const capitalizedItemName = firstCaracter + itemName.slice(1);

    const newItem = new Item({
      name: capitalizedItemName,
    });

    if (listName === "Today") {
      newItem.save();
      res.redirect("/");
    } else {
      List.findOne({ name: listName }).then(function (foundList) {
        foundList.items.push(newItem);
        foundList.save();

        res.redirect("/" + listName);
      });
    }
  });

  app.get("/:customListName", function (req, res) {
    const customListName = req.params.customListName;

    const firstCaracter = customListName.charAt(0).toUpperCase();
    const capitalizedCustomListName = firstCaracter + customListName.slice(1);

    List.findOne({ name: capitalizedCustomListName })
      .then(function (foundList) {
        if (foundList) {
          res.render("list", {
            listTitle: foundList.name,
            newListItems: foundList.items,
          });
        } else {
          const list = new List({
            name: capitalizedCustomListName,
            items: defaultItems,
          });

          list.save();

          res.redirect("/" + customListName);
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  });

  app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
      Item.deleteOne({ _id: checkedItemId })
        .then(function () {
          console.log("successfully deleted checked item");
          res.redirect("/");
        })
        .catch(function (err) {
          console.log(err);
        });
    } else {
      List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      )
        .then(function () {
          res.redirect("/" + listName);
        })
        .catch(function (err) {
          console.log(err);
        });
    }
  });

  app.get("/about", function (req, res) {
    res.render("about");
  });

  app.listen(3000, function () {
    console.log("Server is running on port 3000");
  });
}

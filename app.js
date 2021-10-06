require('dotenv').config();
const express = require("express");
const mongoose = require ("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.SECRET);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const washClothes = new Item({
  name: "Wash clothes"
});

const trashBin = new Item({
  name: "Trash Bin"
});

const buyFuel = new Item({
  name: "Buy Fuel!"
});

const defaultItems = [washClothes, trashBin, buyFuel];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, results){

    if (results.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: results});
    }

  });

});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, results){
    if (!err){
      if (!results){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();

        res.redirect("/" + customListName);

      } else {
        res.render("list", {listTitle: results.name, newListItems: results.items});
      }
    }
  });

  
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList)=> {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted item from list.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList)=>{
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
  
  
  
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});

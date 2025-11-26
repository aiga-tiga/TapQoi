import express, { request } from "express";
import { PORT, mongoURL } from "./config.js";
import mongoose from "mongoose";
import { Item } from "./models/itemmodel.js";
import cors from "cors";
import { createRequire } from "module";
const require = createRequire(import.meta.url);//to require require for multer


const app = express();
app.use(express.json());
app.use(cors());
app.use('/files',express.static("files"))

//================================================== multer ==============================================

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null,uniqueSuffix+file.originalname);
  },
});

const upload = multer({ storage: storage });


// ============================== get =================================

app.get("/item", async (req, res) => {
  try {
    const items = await Item.find({});
    return res.status(200).json({
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// ===============================post===================================

app.post("/item",upload.single("file"), async (req,res)=>{
  console.log(req.file);
  try {
    if (
      !req.body.name ||
      !req.body.email ||
      !req.body.phoneno ||
      !req.body.title ||
      !req.body.description
    ) {
      return res.status(400).send({ message: "all fields sent" });
    }

   const newItem = {
      name: req.body.name,
      email: req.body.email,
      phoneno: req.body.phoneno,
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename,
    };
   const item=await Item.create(newItem);
   return res.status(200).send(item);

  }catch(error){
    console.log(error);
    res.status(500).send("error");
  }

})


// =================================-get id ==================================

app.get("/item/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const item = await Item.findById(id);
    return res.status(200).json(item);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// =================================== delete ============================

app.delete("/item/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Item.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).send({ message: "Item not found" });
    }
    return res.status(200).send({ message: "Item deleted" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`server started at port ${PORT}`);
});

mongoose
  .connect(mongoURL)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((error) => {
    console.log(error);
  });


  // =============================== SEARCH ====================================

app.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Search in title and description fields (case-insensitive)
    const items = await Item.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    });

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
      searchQuery: q
    });

  } catch (error) {
    console.log('Search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during search'
    });
  }
});




router.get("/items/near", async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "Missing coordinates" });
    }

    const items = await Item.find({
      location: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            parseFloat(radius) / 6378.1, // Earth radius in km
          ],
        },
      },
    });

    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

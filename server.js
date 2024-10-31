const express = require("express");
const axios = require("axios");
const path = require("path");
const mongodb = require("mongodb");
const cors = require("cors");

const mongoose = require("mongoose");
const multer = require("multer");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const Cprofile = require("./models/customerprofile");
const Bprofilen = require("./models/bprofilen");
const Message = require("./models/message");

const { GridFsStorage } = require("multer-gridfs-storage");
const { createServer } = require("http");
const { Server } = require("socket.io");
const port = 5000;
const api =
    "mongodb+srv://mjohnmwakio:mgenimpya@cluster0.xugndrv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const app = express();
app.use(cors({
    origin: 'http://localhost:3000', // Replace with your client origin
    methods: ['GET', 'POST'],

}));
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:3000', // Replace with your client origin
        methods: ['GET', 'POST'],

    }
});

app.use(express.urlencoded({ extended: true }));

io.on("connection", (socket) => {
    socket.on("me", (room) => {
        socket.join(room);

        socket.on("newmessage", (msg) => {
            io.to(msg.receiver).emit("receive", msg);
        });
    });
});

//Mongodb Connection with mongoose schema and models
mongoose.connect(api, {
    serverSelectionTimeoutMS: 50000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log("database running...");
});

//gridfs middleware

const storage1 = new GridFsStorage({
    url: api,
    file: (req, file) => {
        return {
            bucketName: "promotion",
        };
    },
});

const upload1 = multer({
    storage: storage1,
});

const storage2 = new GridFsStorage({
    url: api,
    file: (req, file) => {
        return {
            bucketName: "bprofile",
        };
    },
});

const upload2 = multer({
    storage: storage2,
});

//API Routes
app.get("/allposts", async (req, res) => {
    const collection = db.collection("promotion.chunks");
    collection.aggregate(
        [
            {
                $lookup: {
                    from: "promotion.files",
                    localField: "files_id",
                    foreignField: "_id",
                    as: "image",
                },
            },
            {
                $unwind: "$image",
            },

            {
                $group: {
                    _id: "$files_id",
                    metadata: { $first: "$image.metadata" },
                    date: { $last: "$image.uploadDate" },
                    data: { $push: "$data" },
                },
            },
        ],
        async (err, result) => {
            if (err) {
                console.error(err);
                return;
            }
         
            const files = await result.toArray();
           
            files.sort((a, b) => b.date - a.date);
          





            
            res.send(files);
        }
    );
});






app.get("/allbprofiles", async (req, res) => {
    const collection = db.collection("bprofile.chunks");
    collection.aggregate(
        [
            {
                $lookup: {
                    from: "bprofile.files",
                    localField: "files_id",
                    foreignField: "_id",
                    as: "image",
                },
            },
            {
                $unwind: "$image",
            },

            {
                $group: {
                    _id: "$files_id",
                    metadata: { $first: "$image.metadata" },
                    date: { $last: "$image.uploadDate" },
                    data: { $push: "$data" },
                },
            },
        ],
        async (err, result) => {
            if (err) {
                console.error(err);
                return;
            }
            const files = await result.toArray();
            files.sort((a, b) => b.date - a.date);
            res.send(files);
        }
    );
});



app.post("/cprofile", (req, res) => {
    bcrypt.hash(req.body.cprofile.password, saltRounds, async (err, hash) => {
        const profile = new Cprofile({
            username: req.body.cprofile.username,
            email: req.body.cprofile.email,
            password: hash,
        });
        await profile.save();
    });
});

app.post("/bprofl", (req, res) => {
    console.log(req.body);
    bcrypt.hash(req.body.bprofile.password, saltRounds, async (err, hash) => {
        const profile = new Bprofilen({
            email: req.body.bprofile.email,
            password: hash,
            profilepic: req.body.bprofile.profilepic,
            firstname: req.body.bprofile.fname,
            lastname: req.body.bprofile.lname,
            company: req.body.bprofile.company,
            country: req.body.bprofile.country,
            city: req.body.bprofile.city,
            town: req.body.bprofile.town,
            about: req.body.bprofile.about,
            category: req.body.bprofile.category,
        });

        await profile.save();
    });
});





app.get("/", (req, res) => {
    res.send("oyawas");
});

httpServer.listen(port, () => {
    console.log("server running...");
});

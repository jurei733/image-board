const fs = require("fs");
const request = require("request");
const express = require("express");
const db = require("./db.js");
const s3 = require("./middlewares/s3.js");
const uploader = require("./middlewares/uploader.js");
const uid = require("uid-safe");

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.get("/images", (req, res) => {
    if (req.query.id)
        return db.getImage(req.query.id).then(({ rows }) => {
            if (rows.length === 0) return res.sendStatus(404);
            rows[0].next = rows[0].id + 1;
            rows[0].previous = rows[0].id - 1;
            console.log(rows[0]);
            res.json(rows[0]);
        });

    if (req.query.lastId)
        return db.getMoreImages(req.query.lastId).then(({ rows }) => {
            res.json(rows);
        });

    db.getImages().then(({ rows }) => {
        res.json(rows);
    });
});

app.post("/upload", uploader.single("file"), s3, (req, res) => {
    let { tags, title, username, description, url } = req.body;
    tags = tags.split(",");
    db.addImage(url, username, title, description, tags).then(({ rows }) => {
        console.log("DATABASE ADD IMAGE RESPONSE", rows);
        res.json(rows[0]);
    });
});

app.post("/external-upload", (req, res) => {
    console.log(req.query.extURL);
    const url = req.query.extURL;

    if (req.query.extURL) {
        let path = "./uploads/";
        uid(18, function (err, string) {
            if (err) throw err;
            path += string + ".png";
            const download = (url, path, callback) => {
                request.head(url, (err, res, body) => {
                    request(url)
                        .pipe(fs.createWriteStream(path))
                        .on("close", callback);
                });
            };

            download(url, path, () => {
                console.log("✅ Done!");
            });
        });
    }
});

app.post("/comment", (req, res) => {
    const { username, comment } = req.body;

    db.addComment(username, comment, req.body.id).then(({ rows }) => {
        console.log(rows);
        res.json(rows[0]);
    });
});

app.get("/comments/:imageId", (req, res) => {
    console.log(req.params.imageId);
    db.getCommentsById(req.params.imageId).then(({ rows }) => {
        res.json(rows);
    });
});

app.get("/search/:tag", (req, res) => {
    db.getImagesByTag(req.params.tag).then(({ rows }) => {
        res.json(rows);
    });
});

app.get("/tags", (req, res) => {
    db.getAllTags().then(({ rows }) => {
        let tagArray = [];
        let wordcloud = [];
        rows = rows.filter((element) => element.tags !== null);
        rows.forEach((element) => {
            element.tags.forEach((el) => {
                tagArray.push(el);
            });
        });
        //From here on i have an array with all the tags in my tagArray
        //console.log(wordcloud);
        //console.log(tagArray);
        for (let z = 0; tagArray.length > 0; z++) {
            let count = 0;
            for (let i = 0; i < tagArray.length; i++) {
                if (tagArray[i] === tagArray[0]) count++;
            }
            wordcloud.push({ name: tagArray[0], value: count });
            tagArray = tagArray.filter((element) => element !== tagArray[0]);
        }
        //From here on i have in wordcloud the data structure that vue-wordcloud needs

        //console.log(wordcloud);
        //console.log(tagArray);
        //console.log(rows);
        res.json(wordcloud);
    });
});

app.listen(process.env.PORT || 8080, () => console.log("LISTENING ON 8080..."));

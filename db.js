const spicedPg = require("spiced-pg");

const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:reichlej:reichlej@localhost:5432/imageboard"
);

module.exports.getImages = function getImages() {
    return db.query("SELECT * FROM images ORDER BY id DESC LIMIT 9");
};

module.exports.addImage = function addImage(
    url,
    username,
    title,
    description,
    tags
) {
    return db.query(
        "INSERT INTO images (url, username, title, description,tags) VALUES ($1,$2,$3,$4,$5) RETURNING *",
        [url, username, title, description, tags]
    );
};

module.exports.getImage = function getImage(id) {
    return db.query("SELECT * FROM images WHERE id=$1", [id]);
};

module.exports.getMoreImages = function getMoreImages(lastId) {
    return db.query(
        `SELECT * FROM images
        WHERE id < $1
        ORDER BY id DESC
        LIMIT 9`,
        [lastId]
    );
};

module.exports.addComment = function addComment(username, comment, imageId) {
    return db.query(
        "INSERT INTO comments (username, comment, image_id) VALUES ($1,$2,$3) RETURNING *",
        [username, comment, imageId]
    );
};

module.exports.getCommentsById = function getCommentsById(imageId) {
    return db.query("SELECT * FROM comments WHERE image_id=$1", [imageId]);
};

module.exports.getImagesByTag = function getImagesByTag(tag) {
    return db.query("SELECT * FROM images WHERE $1 = ANY (tags)", [tag]);
};

module.exports.getAllTags = function getAllTags() {
    return db.query("SELECT tags FROM images");
};

console.log("STILL SANE");

(function () {
    Vue.component("modal", {
        template: "#modal",
        props: ["id", "images"],
        mounted() {
            this.getImage();
        },
        data: function () {
            return {
                image: {},
            };
        },
        watch: {
            id() {
                this.getImage();
            },
        },
        methods: {
            previousImage() {
                this.id = this.image.previous;
            },
            nextImage() {
                this.id = this.image.next;
            },
            getImagesByTag(tag) {
                console.log("IN THE RIGHT DIRECTION");
                console.log(tag);

                axios
                    .get("/search/" + tag, {
                        tag: tag,
                    })
                    .then((res) => {
                        console.log("RESULT", res.data);
                        this.$emit("receive-images-by-tag", res.data);
                        this.closeModal();
                    });
            },
            getImage() {
                axios
                    .get("/images?id=" + this.id, {
                        id: this.id,
                    })
                    .catch(() => {
                        console.log("CATCHBLOCK WORKS");
                        this.closeModal();
                    })
                    .then((res) => {
                        let date = res.data.created_at.slice(
                            0,
                            res.data.created_at.indexOf("T")
                        );
                        let time = res.data.created_at.slice(
                            11,
                            res.data.created_at.indexOf(".")
                        );
                        res.data.created_at = date + "  " + time;

                        this.image = res.data;
                        if (!res.data) return this.$emit("close");
                    });
            },
            closeModal() {
                this.$emit("close");
            },
        },
    });

    Vue.component("comments", {
        template: "#comments",
        props: ["id"],
        mounted() {
            this.getComments();
        },
        data: function () {
            return {
                error: false,
                comments: [],
                username: "",
                comment: "",
            };
        },
        watch: {
            id() {
                this.getComments();
            },
        },

        methods: {
            addComment() {
                this.error = false;
                console.log("SUBMITTED COMMENT");

                axios
                    .post("/comment", {
                        id: this.id,
                        username: this.username,
                        comment: this.comment,
                    })
                    .then((res) => {
                        console.log(res.data);
                        let date = res.data.created_at.slice(
                            0,
                            res.data.created_at.indexOf("T")
                        );
                        let time = res.data.created_at.slice(
                            11,
                            res.data.created_at.indexOf(".")
                        );
                        res.data.created_at = date + "  " + time;
                        this.comments.push(res.data);
                    })
                    .catch(() => {
                        this.error = true;
                    });
            },
            getComments() {
                axios.get("/comments/" + this.id).then((res) => {
                    console.log(res.data);
                    this.comments = res.data;
                });
            },
        },
    });

    new Vue({
        el: "#main",
        data: {
            recentId: null,
            words: [],
            showAllButton: false,
            showMoreButton: false,
            lastId: null,
            id: location.hash.slice(1),
            images: [],
            error: false,
            confirmation: false,
            form: {
                title: "",
                description: "",
                username: "",
                tags: "",
                file: "",
                externalurl: "",
            },
        },

        mounted() {
            this.getTags();

            window.addEventListener("hashchange", () => {
                this.id = location.hash.slice(1);
            });
            this.getImages();
        },
        methods: {
            getTags() {
                axios.get("/tags").then((results) => {
                    console.log(results);
                    this.words = results.data;
                });
            },
            getImages() {
                this.showAllButton = false;
                axios.get("/images").then((res) => {
                    this.images = res.data;
                    if (res.data.length < 9) {
                        this.showMoreButton = false;
                    } else {
                        this.showMoreButton = true;
                    }
                });
            },

            getImagesByTag(tag) {
                axios
                    .get("/search/" + tag, {
                        tag: tag,
                    })
                    .then((res) => {
                        console.log("RESULT", res.data);
                        console.log(res.data.length);
                        this.images = res.data;
                        this.showMoreButton = false;
                        this.showAllButton = true;
                        this.$emit("receive-images-by-tag", res.data);
                    });
            },
            showImagesByTag(images) {
                this.showAllButton = true;
                this.showMoreButton = false;

                this.images = images;
            },
            moreImages() {
                this.showMoreButton = true;
                this.lastId = [...this.images].pop().id;
                axios.get("/images?lastId=" + this.lastId).then((res) => {
                    if (res.data.length === 0)
                        return (this.showMoreButton = false);
                    if (res.data.length > 0 && res.data.length <= 9) {
                        this.images = this.images.concat(res.data);
                        return (this.showMoreButton = false);
                    }
                });
            },
            openModal(id) {
                this.id = id;
                location.hash = id;
            },
            closeModal() {
                location.hash = "";
                this.id = null;
            },
            handleSubmit() {
                this.error = false;

                console.log("SUBMITTED", this.form);

                if (this.form.externalurl) return this.fetchExternalRessource();

                const formData = new FormData();

                formData.append("title", this.form.title);
                formData.append("description", this.form.description);
                formData.append("username", this.form.username);
                formData.append("tags", this.form.tags);
                formData.append("file", this.form.file);
                formData.append("external-url", this.form.externalurl);

                axios
                    .post("/upload", formData)
                    .then((res) => {
                        this.error = false;
                        this.confirmation = true;
                        console.log(res.data);
                        this.form.title = "";
                        this.form.description = "";
                        this.form.tags = "";
                        this.form.username = res.data.username;
                        document.querySelector("input[type=file]").value = null;
                        this.getTags();
                        this.images.unshift(res.data);
                    })
                    .catch(() => {
                        this.error = true;
                    });
            },
            handleFile(e) {
                this.form.file = e.target.files[0];
            },
            fetchExternalRessource() {
                if (this.form.externalurl)
                    axios
                        .get("/images?extURL=" + this.form.externalurl)
                        .then((result) => {
                            console.log(result);
                        });
            },
        },
    });
})();

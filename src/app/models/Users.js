const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug)
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const user = new Schema({
    username: String,
    password: String,
    role: String,
    lastName: String,
    firstName: String,
    province: String,
    slug: { type: String, slug: "username", unique: true},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('user', user)
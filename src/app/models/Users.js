const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
mongoose.Promise = require('bluebird');

mongoose.plugin(slug)
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const user = new Schema({
    username: String,
    password: String,
    role: String,
    email: String,
    img: String,
    lastname: String,
    firstname: String,
    name: String,
    phone: String,
    province: String,
    district: String,
    award: String,
    address: String,
    slug: { type: String, slug: "username", unique: true},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('user', user)
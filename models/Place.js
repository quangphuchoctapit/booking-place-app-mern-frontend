const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    address: String,
    description: String,
    photos: [String],
    perks: [String],
    extraInfo: String,
    checkIn: String,
    checkOut: String,
    maxGuests: Number
})

const PlaceModel = mongoose.model('Place', PlaceSchema)

module.exports = PlaceModel
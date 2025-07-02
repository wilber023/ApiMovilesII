  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');

  const UserSchema = new mongoose.Schema({
    username: {
      type: String,
      required: [true, 'Por favor ingrese un nombre de usuario'],
      unique: true,
      trim: true
    },
    pin: {
      type: String,
      required: [true, 'Por favor ingrese un PIN'],
      minlength: 4,
      select: false  
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  
  UserSchema.pre('save', async function(next) {
  
    if (!this.isModified('pin')) {
      return next();
    }
    
    try {
  
      const salt = await bcrypt.genSalt(10);
  
      this.pin = await bcrypt.hash(this.pin, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  
  UserSchema.methods.matchPin = async function(enteredPin) {
    return await bcrypt.compare(enteredPin, this.pin);
  };

  module.exports = mongoose.model('User', UserSchema);

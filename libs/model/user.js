var mongoose = require('mongoose'),
	bcrypt = require('bcrypt'),
  saltRounds = 10,

	Schema = mongoose.Schema,

	User = new Schema({
		username: {
			type: String,
			unique: true,
			required: true
		},
    first_name: {
      type: String,
      required: true
    },
    last_name: {
      type: String,
      required: true
    },
    email: {
			type: String,
      lowercase: true,
      required: true,
      unique: true,
      validate: function(email) {
        return /^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)
      }
		},
		password: {
			type: String,
			required: true
		},
    verified: {
      type: Boolean,
      required: true,
      default: false
    },
		created: {
			type: Date,
			default: Date.now
		}
	});


User.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    bcrypt.hash(user.password, saltRounds, function(err, hash) {
      user.password = hash;
      next();
    });

});

User.virtual('userId')
.get(function () {
	return this.id;
});


User.methods.checkPassword = function(password) {
  return bcrypt.compareSync(password, this.password); // true
};

module.exports = mongoose.model('User', User);

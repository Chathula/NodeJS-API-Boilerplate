var express = require('express');
var passport = require('passport');
var router = express.Router();

var libs = process.cwd() + '/libs/';

// Log for development
var log = require(libs + 'log')(module);

var AccessToken = require(libs + 'model/accessToken');
var RefreshToken = require(libs + 'model/refreshToken');
var db = require(libs + 'db/mongoose');
var User = require(libs + 'model/user');

// Generate random token
// var code = Math.floor((Math.random()*999999)+111111);

router.get('/info', passport.authenticate('bearer', { session: false }), function(req, res) {
        // req.authInfo is set using the `info` argument supplied by
        // `BearerStrategy`.  It is typically used to indicate scope of the token,
        // and used in access control checks.  For illustrative purposes, this
        // example simply returns the scope in the response.
        res.json({
        	user_id: req.user.userId,
        	username: req.user.username,
          first_name: req.user.username,
          last_name: req.user.username,
          email: req.user.email,
        	// scope: req.authInfo.scope
        });
    }
);

router.get('/', passport.authenticate('bearer', { session: false }), function (req, res) {
  var query = User.find({}).select('-password');

  query.exec(function (err, users) {
    if (err) return res.json({status: false, error: err});

    return res.json({status: true, data: users});
  });

});

router.post('/', passport.authenticate('bearer', { session: false }), function (req, res) {
  var user = new User({
      username: req.body.username,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: req.body.password
  });

  user.save(function (err) {
    if (!err) {
      return res.json({
        status: true,
        data: user
      });
    } else {
      if(err.name === 'ValidationError') {
        res.statusCode = 400;
        res.json({
          status: false,
          error: err
        });
      } else {
        res.statusCode = 500;

        log.error('Internal error(%d): %s', res.statusCode, err.message);

        res.json({
          status: false,
          error: 'Server error'
        });
      }
    }
  });

});

router.get('/:id', passport.authenticate('bearer', { session: false }), function(req, res) {

  var query = User.findById(req.params.id).select('-password');

  query.exec(function (err, user) {

    if(!user) {
      res.statusCode = 404;

      return res.json({
        status: false,
        error: 'Not found'
      });
    }

    if (!err) {
      return res.json({
        status: true,
        data: user
      });
    } else {
      res.statusCode = 500;
      log.error('Internal error(%d): %s',res.statusCode,err.message);

      return res.json({
        status: false,
        error: 'Server error'
      });
    }
  })

});

router.put('/:id', passport.authenticate('bearer', { session: false }), function (req, res){
	var userId = req.params.id;

	User.findById(userId, function (err, user) {
		if(!user) {
			res.statusCode = 404;
			log.error('User with id: %s Not Found', userId);
			return res.json({
        status: false,
				error: 'Not found'
			});
		}

		user.first_name = req.body.first_name;
    user.last_name = req.body.last_name;
		user.email = req.body.email;

		user.save(function (err) {
			if (!err) {
				log.info("User with id: %s updated", user.id);
				return res.json({
					status: true,
					data: user
				});
			} else {
				if(err.name === 'ValidationError') {
					res.statusCode = 400;
					return res.json({
            status: false,
						error: 'Validation error'
					});
				} else {
					res.statusCode = 500;

					return res.json({
            status: false,
						error: 'Server error'
					});
				}
				log.error('Internal error (%d): %s', res.statusCode, err.message);
			}
		});
	});
});

router.delete('/:id', passport.authenticate('bearer', { session: false }), function (req, res){
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if(!user) {
      res.statusCode = 404;
      log.error('User with id: %s Not Found', userId);

      return res.json({ status: false, error: 'User Not Found' });
		} else {
      res.statusCode = 200;

      AccessToken.findOneAndRemove({userId: userId}, function (err, removed) {
        if (err) return res.json({ status: false, message: 'Unknown Error' });
      });

      RefreshToken.findOneAndRemove({userId: userId}, function (err, removed) {
        if (err) return res.json({ status: false, message: 'Unknown Error' });
      });

      user.remove({_id: userId}, function (err, removed) {
        if (err) return res.json({ status: false, message: 'Unknown Error' });
        return res.json({
          status: true,
          message: 'User deleted successfully'
        });
      });

    }

	});

});


// Test Route without oAuth
// router.get('/test', function(req, res) {
//         user.find(function (err, users) {
//           res.json(users);
//         });
//     }
// );

module.exports = router;

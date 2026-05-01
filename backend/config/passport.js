const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

module.exports = function(passport) {
  passport.serializeUser((user, done) => {
    if (user.isPending) {
      // For pending users, serialize the whole object (or a flag)
      return done(null, { isPending: true, data: user });
    }
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      if (id && id.isPending) {
        return done(null, id.data);
      }
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Local Strategy
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return done(null, false, { message: 'Incorrect email or password.' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return done(null, false, { message: 'Incorrect email or password.' });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (!user) user = await User.findOne({ email: profile.emails[0].value });
          
          if (!user) {
            // Return an "unregistered" user object (no _id)
            return done(null, {
              googleId: profile.id,
              email: profile.emails[0].value,
              displayName: profile.displayName,
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              isPending: true
            });
          } else if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
};

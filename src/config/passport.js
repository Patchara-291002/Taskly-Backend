const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profile: profile.photos[0].value,
            isVerified: true, 
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize User
passport.serializeUser((user, done) => {
  done(null, user.id); // เก็บ user.id ใน session
});

// Deserialize User
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id); // ค้นหาผู้ใช้จาก id ที่อยู่ใน session
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

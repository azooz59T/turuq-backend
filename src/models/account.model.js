import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;

/**
 * Account = an API credential used to obtain a JWT. Kept separate from the
 * User *profile* (which is just data) so the profile schema stays faithful to
 * the assessment spec (name/email/age only).
 */
const accountSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // excluded from queries by default — never returned casually
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        delete ret._id;
        delete ret.password; // belt-and-suspenders: never expose the hash
        return ret;
      },
    },
  }
);

accountSchema.index({ email: 1 }, { unique: true });

// Hash the password before saving, but only when it actually changed.
// Async middleware: await and return — no `next` callback in modern Mongoose.
accountSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare a plaintext candidate against the stored hash.
accountSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const Account = model('Account', accountSchema);

export default Account;

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * User Profile schema.
 *
 * Fields per the assessment spec:
 *  - name      : required
 *  - email     : required, unique (enforced by the index below), normalized
 *  - age       : optional integer within a sane range
 *  - createdAt : added automatically by `timestamps`
 */
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [1, 'Name cannot be empty'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true, // normalize so uniqueness is not case-sensitive
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      max: [120, 'Age must be 120 or below'],
      validate: {
        validator: Number.isInteger,
        message: 'Age must be an integer',
      },
    },
  },
  {
    // Adds createdAt (required by spec) and updatedAt (useful, harmless).
    timestamps: true,
    // Clean API output: expose `id`, drop internal `_id`/`__v`.
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true, versionKey: false },
  }
);

// Unique index on the (normalized) email — enforces the "unique email"
// requirement at the database level and makes lookups by email fast.
userSchema.index({ email: 1 }, { unique: true });

// Index on age to keep age-range filtering (GET /users?minAge=&maxAge=) efficient.
userSchema.index({ age: 1 });

const User = model('User', userSchema);

export default User;

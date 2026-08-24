import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, default: 'citizen' },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    phone: String,
    org: String,
  },
  { timestamps: true },
)

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.__v
    delete ret.password
    return ret
  },
})

export const User = mongoose.model('User', UserSchema)

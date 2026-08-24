import mongoose from 'mongoose'

const TimelineEntry = new mongoose.Schema(
  { status: String, at: String, note: String },
  { _id: false },
)

const LocationSchema = new mongoose.Schema(
  {
    method: String,
    village: String,
    block: String,
    district: { type: String, index: true },
    state: String,
    label: String,
    lat: Number,
    lng: Number,
  },
  { _id: false },
)

// The Report is the platform's core entity — a crowdsourced societal challenge
// tracked from citizen submission all the way to a piloted, resolved solution.
const ReportSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true }, // human ID e.g. SS-20100
    uid: String,
    category: { type: String, index: true },
    title: String,
    description: String,
    photos: [String],
    location: LocationSchema,
    status: { type: String, index: true, default: 'submitted' },
    priority: { type: String, default: 'medium' },
    votes: { type: Number, default: 1 },
    ai: mongoose.Schema.Types.Mixed,
    reporter: mongoose.Schema.Types.Mixed,
    needs: [String],
    assignedUniversity: { type: String, default: null },
    assignedIndustry: { type: String, default: null },
    timeline: [TimelineEntry],
    pending: { type: Boolean, default: false },
    seeded: { type: Boolean, default: false },
    // When set, this report was detected as a duplicate and folded into another
    // (canonical) challenge. Merged reports are hidden from lists and stats.
    mergedInto: { type: String, default: null },
    // Stored as ISO strings to stay identical with the offline client store.
    createdAt: String,
    updatedAt: String,
  },
  { minimize: false },
)

// Return clean client-shaped JSON (drop Mongo internals).
ReportSchema.set('toJSON', {
  virtuals: false,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.__v
    return ret
  },
})

export const Report = mongoose.model('Report', ReportSchema)

import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema({
  empId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  qualification: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one qualification is required'
    }
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  expertise: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one area of expertise is required'
    }
  },
  department: {
    type: String,
    trim: true,
    default: null // Optional field for executives/CEO
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  info: {
    type: String,
    required: true,
    trim: true
  },
  aboutMe: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance

teamMemberSchema.index({ department: 1 });
teamMemberSchema.index({ role: 1 });

// Pre-save middleware to generate empId if not provided
teamMemberSchema.pre('save', async function(next) {
  if (!this.empId) {
    // Generate empId in format: EMP001, EMP002, etc.
    const lastEmployee = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextNumber = 1;
    
    if (lastEmployee && lastEmployee.empId) {
      const lastNumber = parseInt(lastEmployee.empId.replace('EMP', ''));
      nextNumber = lastNumber + 1;
    }
    
    this.empId = `EMP${nextNumber.toString().padStart(3, '0')}`;
  }
  next();
});

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

export default TeamMember;
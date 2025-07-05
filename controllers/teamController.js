import TeamMember from '../models/TeamMember.js';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';

// @desc    Create a new team member
// @route   POST /api/team
// @access  Private (Admin)
export const createTeamMember = async (req, res) => {
  try {
    const {
      empId,
      name,
      qualification,
      experience,
      expertise,
      department,
      role,
      info,
      aboutMe
    } = req.body;

    // Check if employee ID already exists
    if (empId) {
      const existingEmployee = await TeamMember.findOne({ empId: empId.toUpperCase() });
      if (existingEmployee) {
        // Delete uploaded file if it exists
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }

    // Check if image is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profile image is required'
      });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'ca-firm/team-members',
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', quality: 'auto' }
      ]
    });

    // Delete local file after upload
    fs.unlinkSync(req.file.path);

    // Parse arrays if they come as strings
    const parsedQualification = Array.isArray(qualification) ? qualification : qualification.split(',').map(q => q.trim());
    const parsedExpertise = Array.isArray(expertise) ? expertise : expertise.split(',').map(e => e.trim());

    // Create team member
    const teamMember = new TeamMember({
      empId: empId?.toUpperCase(),
      name,
      qualification: parsedQualification,
      experience: parseInt(experience),
      expertise: parsedExpertise,
      department: department || null,
      role,
      info,
      aboutMe,
      image: {
        public_id: result.public_id,
        url: result.secure_url
      }
    });

    await teamMember.save();

    res.status(201).json({
      success: true,
      message: 'Team member created successfully',
      data: teamMember
    });

  } catch (error) {
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Create team member error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// @desc    Get all team members
// @route   GET /api/team
// @access  Public
export const getAllTeamMembers = async (req, res) => {
  try {
    const { department, role, isActive = true } = req.query;
    
    // Build filter object
    const filter = { isActive: isActive === 'true' };
    
    if (department && department !== 'all') {
      filter.department = new RegExp(department, 'i');
    }
    
    if (role && role !== 'all') {
      filter.role = new RegExp(role, 'i');
    }

    const teamMembers = await TeamMember.find(filter)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: teamMembers.length,
      data: teamMembers
    });

  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get single team member
// @route   GET /api/team/:empId
// @access  Public
export const getTeamMember = async (req, res) => {
  try {
    const { empId } = req.params;

    const teamMember = await TeamMember.findOne({ 
      empId: empId.toUpperCase(),
      isActive: true 
    }).select('-__v');

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: teamMember
    });

  } catch (error) {
    console.error('Get team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update team member
// @route   PUT /api/team/:empId
// @access  Private (Admin)
export const updateTeamMember = async (req, res) => {
  try {
    const { empId } = req.params;
    const {
      name,
      qualification,
      experience,
      expertise,
      department,
      role,
      info,
      aboutMe
    } = req.body;

    const teamMember = await TeamMember.findOne({ empId: empId.toUpperCase() });

    if (!teamMember) {
      // Clean up uploaded file if it exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Handle image update
    let imageUpdate = {};
    if (req.file) {
      // Delete old image from Cloudinary
      await cloudinary.uploader.destroy(teamMember.image.public_id);

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'ca-firm/team-members',
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', quality: 'auto' }
        ]
      });

      // Delete local file
      fs.unlinkSync(req.file.path);

      imageUpdate = {
        image: {
          public_id: result.public_id,
          url: result.secure_url
        }
      };
    }

    // Parse arrays if they come as strings
    const parsedQualification = qualification ? 
      (Array.isArray(qualification) ? qualification : qualification.split(',').map(q => q.trim())) 
      : teamMember.qualification;
      
    const parsedExpertise = expertise ? 
      (Array.isArray(expertise) ? expertise : expertise.split(',').map(e => e.trim())) 
      : teamMember.expertise;

    // Update team member
    const updatedTeamMember = await TeamMember.findOneAndUpdate(
      { empId: empId.toUpperCase() },
      {
        ...(name && { name }),
        ...(qualification && { qualification: parsedQualification }),
        ...(experience && { experience: parseInt(experience) }),
        ...(expertise && { expertise: parsedExpertise }),
        ...(department !== undefined && { department: department || null }),
        ...(role && { role }),
        ...(info && { info }),
        ...(aboutMe && { aboutMe }),
        ...imageUpdate
      },
      { new: true, runValidators: true }
    ).select('-__v');

    res.status(200).json({
      success: true,
      message: 'Team member updated successfully',
      data: updatedTeamMember
    });

  } catch (error) {
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Update team member error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// @desc    Delete team member (soft delete)
// @route   DELETE /api/team/:empId
// @access  Private (Admin)
export const deleteTeamMember = async (req, res) => {
  try {
    const { empId } = req.params;

    const teamMember = await TeamMember.findOne({ empId: empId.toUpperCase() });

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Soft delete - just mark as inactive
    teamMember.isActive = false;
    await teamMember.save();

    res.status(200).json({
      success: true,
      message: 'Team member deleted successfully'
    });

  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Permanently delete team member
// @route   DELETE /api/team/:empId/permanent
// @access  Private (Admin)
export const permanentDeleteTeamMember = async (req, res) => {
  try {
    const { empId } = req.params;

    const teamMember = await TeamMember.findOne({ empId: empId.toUpperCase() });

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(teamMember.image.public_id);

    // Delete from database
    await TeamMember.findOneAndDelete({ empId: empId.toUpperCase() });

    res.status(200).json({
      success: true,
      message: 'Team member permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get team statistics
// @route   GET /api/team/stats
// @access  Public
export const getTeamStats = async (req, res) => {
  try {
    const totalMembers = await TeamMember.countDocuments({ isActive: true });
    
    const departmentStats = await TeamMember.aggregate([
      { $match: { isActive: true } },
      { 
        $group: { 
          _id: '$department', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ]);

    const roleStats = await TeamMember.aggregate([
      { $match: { isActive: true } },
      { 
        $group: { 
          _id: '$role', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ]);

    const avgExperience = await TeamMember.aggregate([
      { $match: { isActive: true } },
      { 
        $group: { 
          _id: null, 
          avgExp: { $avg: '$experience' } 
        } 
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalMembers,
        departmentStats,
        roleStats,
        averageExperience: avgExperience[0]?.avgExp || 0
      }
    });

  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
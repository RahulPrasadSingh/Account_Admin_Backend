import express from 'express';
import upload from '../middelware/upload.js';
import {
  createTeamMember,
  getAllTeamMembers,
  getTeamMember,
  updateTeamMember,
  deleteTeamMember,
  permanentDeleteTeamMember,
  getTeamStats
} from '../controllers/teamController.js';

const router = express.Router();

// GET /api/team/stats - Get team statistics
router.get('/stats', getTeamStats);

// GET /api/team - Get all team members
router.get('/', getAllTeamMembers);

// GET /api/team/:empId - Get single team member
router.get('/:empId', getTeamMember);

// POST /api/team - Create new team member
router.post('/', upload.single('image'), createTeamMember);

// PUT /api/team/:empId - Update team member
router.put('/:empId', upload.single('image'), updateTeamMember);

// DELETE /api/team/:empId - Soft delete team member
router.delete('/:empId', deleteTeamMember);

// DELETE /api/team/:empId/permanent - Permanently delete team member
router.delete('/:empId/permanent', permanentDeleteTeamMember);

export default router;
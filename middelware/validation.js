// file not in use for future reference
export const validateTeamMember = (req, res, next) => {
  const {
    name,
    qualification,
    experience,
    expertise,
    role,
    info,
    aboutMe
  } = req.body;

  const errors = [];

  // Required field validations
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!qualification || (Array.isArray(qualification) && qualification.length === 0) || 
      (typeof qualification === 'string' && qualification.trim().length === 0)) {
    errors.push('At least one qualification is required');
  }

  if (!experience || isNaN(experience) || parseInt(experience) < 0) {
    errors.push('Valid experience (number >= 0) is required');
  }

  if (!expertise || (Array.isArray(expertise) && expertise.length === 0) || 
      (typeof expertise === 'string' && expertise.trim().length === 0)) {
    errors.push('At least one area of expertise is required');
  }

  if (!role || role.trim().length === 0) {
    errors.push('Role is required');
  }

  if (!info || info.trim().length === 0) {
    errors.push('Info is required');
  }

  if (!aboutMe || aboutMe.trim().length === 0) {
    errors.push('About me is required');
  }

  // Name validation (only letters and spaces)
  if (name && !/^[a-zA-Z\s]+$/.test(name.trim())) {
    errors.push('Name should only contain letters and spaces');
  }

  // Experience validation
  if (experience && (parseInt(experience) > 60)) {
    errors.push('Experience cannot exceed 60 years');
  }

  // Info and aboutMe length validation
  if (info && info.trim().length > 500) {
    errors.push('Info should not exceed 500 characters');
  }

  if (aboutMe && aboutMe.trim().length > 1000) {
    errors.push('About me should not exceed 1000 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

export const validateEmpId = (req, res, next) => {
  const { empId } = req.params;

  if (!empId || empId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Employee ID is required'
    });
  }

  // EmpId format validation (EMP followed by numbers)
  if (!/^EMP\d{3,}$/i.test(empId.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Employee ID format. Should be like EMP001, EMP002, etc.'
    });
  }

  next();
};
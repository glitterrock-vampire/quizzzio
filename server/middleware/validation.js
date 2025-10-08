import Joi from 'joi';

// User registration validation
export const validateUserRegistration = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    full_name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name must be less than 100 characters',
      'any.required': 'Full name is required'
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details[0].message
    });
  }

  next();
};

// User login validation
export const validateUserLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details[0].message
    });
  }

  next();
};

// Quiz generation validation
export const validateQuizGeneration = (req, res, next) => {
  const schema = Joi.object({
    subject: Joi.string().valid('math', 'science', 'history', 'geography', 'literature').required(),
    questionCount: Joi.number().integer().min(1).max(20).required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details[0].message
    });
  }

  next();
};

// Quiz session validation
export const validateQuizSession = (req, res, next) => {
  const schema = Joi.object({
    user_id: Joi.number().integer().required(),
    subject: Joi.string().valid('math', 'science', 'history', 'geography', 'literature').required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
    total_questions: Joi.number().integer().min(1).max(50).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details[0].message
    });
  }

  next();
};

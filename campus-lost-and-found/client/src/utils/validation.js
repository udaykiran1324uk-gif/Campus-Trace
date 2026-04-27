export const validatePassword = (password, userData = {}) => {
  const errors = [];
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  if (password.length < minLength) errors.push("Minimum 8 characters");
  if (!hasUppercase || !hasLowercase) errors.push("Mix of uppercase and lowercase letters");
  if (!hasNumber) errors.push("At least one number (0-9)");
  if (!hasSpecial) errors.push("At least one special character (!@#$%^&*)");

  // Personal Info Check - Professional Feedback
  if (userData.name && password.toLowerCase().includes(userData.name.toLowerCase().split(' ')[0])) {
    errors.push("Password should not contain your name");
  }
  if (userData.phone && password.includes(userData.phone)) {
    errors.push("Password should not contain your phone number");
  }
  if (userData.studentId && password.includes(userData.studentId)) {
    errors.push("Password should not contain your student ID");
  }

  const commonWords = ['password', '123456', 'qwerty', 'admin', 'campus'];
  if (commonWords.some(word => password.toLowerCase().includes(word))) {
    errors.push("Avoid common words like 'password' or '123456'");
  }
  
  return errors.length > 0 ? "Security Requirements: " + errors.join(", ") : null;
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phoneRegex.test(phone)) return "Enter a valid phone number (10-15 digits)";
  return null;
};

/**
 * Transform technical database/API errors into user-friendly messages
 */
export const getUserFriendlyErrorMessage = (error: any): string => {
  if (!error) return "Something went wrong. Please try again.";

  const message = error?.message || String(error);

  // Database constraint errors
  if (message.includes("duplicate key") || message.includes("Duplicate entry")) {
    if (message.includes("email")) {
      return "This email is already in use. Please use a different email address.";
    }
    if (message.includes("username")) {
      return "This username is already taken. Please choose another one.";
    }
    return "This record already exists. Please check your data and try again.";
  }

  // Primary key constraint
  if (message.includes("PRIMARY KEY") || message.includes("primary key")) {
    return "This email is already in use. Please use a different email address.";
  }

  // Foreign key constraint
  if (message.includes("FOREIGN KEY") || message.includes("foreign key") || message.includes("violates")) {
    return "This record is linked to other data. Please ensure all required fields are valid.";
  }

  // Authentication errors
  if (message.includes("Invalid login credentials") || message.includes("invalid credentials")) {
    return "Invalid email or password. Please try again.";
  }

  if (message.includes("Email not confirmed")) {
    return "Please confirm your email before logging in.";
  }

  // Network/general errors
  if (message.includes("Network") || message.includes("network")) {
    return "Network error. Please check your connection and try again.";
  }

  // Fallback: use original message if it's already user-friendly
  if (message.length < 150 && !message.includes("query") && !message.includes("constraint")) {
    return message;
  }

  return "Something went wrong. Please try again or contact support if the problem persists.";
};

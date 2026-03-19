const { UserDTO } = require('./user.dto');

class UserDetailsDTO extends UserDTO {
  constructor(user) {
    super(user);
    this.emailVerified = user.emailVerified;
    this.lastLogin = user.lastLogin;
    this.preferences = user.preferences;
    this.deletedAt = user.deletedAt;
    this.loginAttempts = user.loginAttempts;
    this.lockUntil = user.lockUntil;
  }

  static fromDocument(user) {
    if (!user) return null;
    return new UserDetailsDTO(user);
  }
}

module.exports = { UserDetailsDTO };
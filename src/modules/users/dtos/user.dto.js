class UserDTO {
  constructor(user) {
    this.id = user._id || user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.phoneNumber = user.phoneNumber;
    this.isActive = user.isActive;
    this.lastLogin = user.lastLogin;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  static fromDocument(user) {
    if (!user) return null;
    return new UserDTO(user);
  }

  static fromArray(users) {
    return users.map(user => UserDTO.fromDocument(user));
  }
}

class UserProfileDTO {
  constructor(user) {
    this.id = user._id || user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.phoneNumber = user.phoneNumber;
    this.createdAt = user.createdAt;
  }

  static fromDocument(user) {
    if (!user) return null;
    return new UserProfileDTO(user);
  }
}

class UserListDTO {
  constructor(user) {
    this.id = user._id || user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
  }

  static fromDocument(user) {
    if (!user) return null;
    return new UserListDTO(user);
  }

  static fromArray(users) {
    return users.map(user => UserListDTO.fromDocument(user));
  }
}

module.exports = {
  UserDTO,
  UserProfileDTO,
  UserListDTO
};
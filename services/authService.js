const bcrypt = require("bcryptjs");
const jwtHelper = require("../utils/jwtHelper");
const userRepository = require("../repositories/userRepository");

const login = async (username, password) => {
  const user = await userRepository.findByUsername(username);
  if (!user) throw { statusCode: 401, message: "Invalid credentials" };

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw { statusCode: 401, message: "Invalid credentials" };

  const accessToken = jwtHelper.generateAccessToken(user);

  return { accessToken };
};

module.exports = {
  login,
};

const permissions = {
  admin: {
    create: ["manager"],
    view: ["manager", "citymanager", "superagent", "agent", "player"],
    updatePassword: [
      "admin",
      "manager",
      "citymanager",
      "superagent",
      "agent",
      "player",
    ],
  },
  manager: {
    create: ["citymanager"],
    view: ["citymanager", "superagent", "agent", "player"],
    updatePassword: ["citymanager"],
  },
  citymanager: {
    create: ["superagent"],
    view: ["superagent", "agent", "player"],
    updatePassword: ["superagent"],
  },
  superagent: {
    create: ["agent"],
    view: ["agent", "player"],
    updatePassword: ["agent"],
  },
  agent: {
    create: ["player"],
    view: ["player"],
    updatePassword: ["player"],
  },
  player: {
    create: [],
    view: [],
    updatePassword: [],
  },
};

module.exports = permissions;

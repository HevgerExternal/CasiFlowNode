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
    canDeposit: ["manager", "citymanager", "superagent", "agent", "player"],
    canWithdraw: ["manager", "citymanager", "superagent", "agent", "player"],
  },
  manager: {
    create: ["citymanager"],
    view: ["citymanager", "superagent", "agent", "player"],
    updatePassword: ["citymanager"],
    canDeposit: ["citymanager"],
    canWithdraw: ["citymanager"],
  },
  citymanager: {
    create: ["superagent"],
    view: ["superagent", "agent", "player"],
    updatePassword: ["superagent"],
    canDeposit: ["superagent"],
    canWithdraw: ["superagent"],
  },
  superagent: {
    create: ["agent"],
    view: ["agent", "player"],
    updatePassword: ["agent"],
    canDeposit: ["agent"],
    canWithdraw: ["agent"],
  },
  agent: {
    create: ["player"],
    view: ["player"],
    updatePassword: ["player"],
    canDeposit: ["player"],
    canWithdraw: ["player"],
  },
  player: {
    create: [],
    view: [],
    updatePassword: [],
    canDeposit: [],
    canWithdraw: [],
  },
};

module.exports = permissions;

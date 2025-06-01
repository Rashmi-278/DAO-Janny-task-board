
// Complete ABI for ProposalDecision contract
export const PROPOSAL_DECISION_ABI = [
  {
    "inputs": [],
    "name": "ADMIN_ROLE",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "hasRole",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "taskId", "type": "string" },
      { "internalType": "address[]", "name": "eligibleMembers", "type": "address[]" },
      { "internalType": "bytes32", "name": "userRandomNumber", "type": "bytes32" }
    ],
    "name": "assignTask",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "taskId", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "assignedTo", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "randomIndex", "type": "uint256" }
    ],
    "name": "TaskAssigned",
    "type": "event"
  }
] as const;

// Pyth Entropy ABI for fee estimation
export const PYTH_ENTROPY_ABI = [
  {
    "inputs": [],
    "name": "getFee",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;


export const typeColors = {
  governance: 'bg-purple-500/20 text-purple-300',
  treasury: 'bg-blue-500/20 text-blue-300',
  community: 'bg-pink-500/20 text-pink-300',
  technical: 'bg-cyan-500/20 text-cyan-300',
  grants: 'bg-orange-500/20 text-orange-300',
  operations: 'bg-indigo-500/20 text-indigo-300'
};

export const checkDAOMembership = async (daoId: string, voterAddress: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://membersuri.daostar.org/is_member/${daoId}.eth?voter=${voterAddress}&onchain=${daoId}`);
    const data = await response.json();
    return data.is_member === true;
  } catch (error) {
    console.error('Failed to check DAO membership:', error);
    return false;
  }
};

export const createSafeTask = (task: any) => ({
  id: task.id || `task-${Math.random()}`,
  title: task.title || 'Untitled Task',
  description: task.description || 'No description available',
  assignee: task.assignee || null,
  priority: task.priority || 'medium',
  deadline: task.deadline || new Date().toISOString(),
  type: task.type || 'operations',
  allowsOptIn: task.allowsOptIn || false,
  allowsRandomAssignment: task.allowsRandomAssignment || false
});

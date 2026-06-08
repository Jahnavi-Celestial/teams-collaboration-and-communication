import { gql } from "@apollo/client";

export const Register = gql`
  mutation register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password)
  }
`;

export const Login = gql`
  mutation login($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`;

export const GoogleLoginMutation = gql`
  mutation googleLogin($idToken: String!) {
    googleLogin(idToken: $idToken)
  }
`;

export const createTeamWithMembers = gql`
  mutation CreateTeamWithMembers(
    $name: String!
    $description: String
    $memberIds: [String!]!
    $isPublic: Boolean!
  ) {
    createTeamWithMembers(
      name: $name
      description: $description
      memberIds: $memberIds
      isPublic: $isPublic
    ) {
      id
      name
      description
      is_public
      created_at
      updated_at
      created_by {
        id
        name
        email
        created_at
      }
    }
  }
`;


export const JoinTeams = gql`
  mutation JoinTeams($teamIds: [String!]!) {
    joinTeams(teamIds: $teamIds) {
      id
      role
      user {
        id
      }
      team {
        id
      }
    }
  }
`;

export const DeleteTeam = gql`
  mutation DeleteTeam($teamId: String!) {
    deleteTeam(teamId: $teamId)
  }
`;

export const AddMemberToTeam = gql`
  mutation AddMembersToTeam($teamId: String!, $userIds: [String!]!) {
    addMembersToTeam(teamId: $teamId, userIds: $userIds)
  }
`;

export const ChangeMemberRole = gql`
  mutation ChangeMemberRole($teamId: String!, $memberId: String!, $newRole: UserRole!) {
    changeMemberRole(teamId: $teamId, memberId: $memberId, newRole: $newRole)
  }
`;

export const RemoveMemberFromTeam = gql`
  mutation RemoveMemberFromTeam($teamId: String!, $memberId: String!) {
    removeMemberFromTeam(teamId: $teamId, memberId: $memberId)
  }
`;

export const ExitTeam = gql`
  mutation ExitTeam($teamId: String!) {
    exitTeam(teamId: $teamId)
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask(
    $teamId: String!
    $subject: String!
    $description: String!
    $assignedToUserId: String!
    $deadline: DateTimeISO!
  ) {
    createTask(
      teamId: $teamId
      subject: $subject
      description: $description
      assignedToUserId: $assignedToUserId
      deadline: $deadline
    ) {
      id
        subject
        description
        deadline
        created_at
        status
        deadline_unlocked
        deadline_missed_at
        assigned_to {
            id
            name
            email
            created_at
            updated_at
        }
        assigned_by {
            id
            name
            email
            created_at
            updated_at
        }
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($taskId: String!) {
    deleteTask(taskId: $taskId)
  }
`;

export const ImportTeams = gql`
  mutation ImportTeams($teamId: String!, $file: Upload!) {
    importTeams(teamId: $teamId, file: $file)
  }
`;